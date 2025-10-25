import {
  WhatsAppEndpoint,
  WhatsAppConfiguration,
  WhatsAppEndpointConfig,
} from '@/types/whatsapp';
import { WhatsAppClient } from './whatsapp-client';
import { kvGet, kvSet, kvDelete } from '@/lib/cache/key-value-store';
import { createClient } from '@supabase/supabase-js';

/**
 * Simplified endpoint manager: 1 Tenant = 1 Endpoint
 * 
 * Architecture:
 * - Tenant A → Endpoint 1
 * - Tenant B → Endpoint 2
 * - Tenant C → Endpoint 3
 * (No primary/backup, no failover)
 */
export class WhatsAppEndpointManager {
  private static instance: WhatsAppEndpointManager;
  private clients: Map<string, WhatsAppClient> = new Map(); // key: tenantId
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map(); // key: tenantId
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  static getInstance(): WhatsAppEndpointManager {
    if (!WhatsAppEndpointManager.instance) {
      WhatsAppEndpointManager.instance = new WhatsAppEndpointManager();
    }
    return WhatsAppEndpointManager.instance;
  }

  /**
   * Get configuration for a tenant (includes its single endpoint)
   */
  async getConfiguration(tenantId: string): Promise<WhatsAppConfiguration | null> {
    try {
      const configKey = `whatsapp:config:${tenantId}`;
      const rawConfig = await kvGet<WhatsAppConfiguration>(configKey);

      if (!rawConfig) {
        return null;
      }

      return {
        ...rawConfig,
        endpoint: {
          ...rawConfig.endpoint,
          createdAt: new Date(rawConfig.endpoint.createdAt),
          updatedAt: new Date(rawConfig.endpoint.updatedAt),
          lastHealthCheck: rawConfig.endpoint.lastHealthCheck ? new Date(rawConfig.endpoint.lastHealthCheck) : new Date(),
        },
        createdAt: new Date(rawConfig.createdAt),
        updatedAt: new Date(rawConfig.updatedAt),
      };
    } catch (error) {
      console.error('Error getting WhatsApp configuration:', error);
      return null;
    }
  }

  /**
   * Get endpoint for a specific tenant (from database first, then cache)
   */
  async getEndpoint(tenantId: string): Promise<WhatsAppEndpoint | null> {
    try {
      // Try database first (persistent storage)
      const { data: dbEndpoint, error } = await this.supabase
        .from('whatsapp_endpoints')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      if (!error && dbEndpoint) {
        // Map database endpoint to WhatsAppEndpoint type
        const endpoint: WhatsAppEndpoint = {
          id: dbEndpoint.id,
          tenantId: dbEndpoint.tenant_id,
          name: dbEndpoint.name,
          apiUrl: dbEndpoint.api_url,
          apiKey: dbEndpoint.api_key,
          webhookUrl: dbEndpoint.webhook_url,
          webhookSecret: dbEndpoint.webhook_secret,
          isActive: dbEndpoint.is_active,
          healthStatus: dbEndpoint.health_status,
          lastHealthCheck: dbEndpoint.last_health_check ? new Date(dbEndpoint.last_health_check) : new Date(),
          createdAt: new Date(dbEndpoint.created_at),
          updatedAt: new Date(dbEndpoint.updated_at),
        };

        // Also update cache for faster subsequent access
        const config = await this.getConfiguration(tenantId);
        if (!config || !config.endpoint) {
          await this.setEndpoint(tenantId, {
            id: endpoint.id,
            tenantId: endpoint.tenantId,
            name: endpoint.name,
            apiUrl: endpoint.apiUrl,
            apiKey: endpoint.apiKey,
            webhookUrl: endpoint.webhookUrl,
            webhookSecret: endpoint.webhookSecret,
            isActive: endpoint.isActive,
            healthStatus: endpoint.healthStatus,
            lastHealthCheck: endpoint.lastHealthCheck,
          });
        }

        return endpoint;
      }

      // Fallback to cache if database lookup fails
      const config = await this.getConfiguration(tenantId);
      return config?.endpoint || null;
    } catch (error) {
      console.error('Error getting endpoint from database:', error);
      // Fallback to cache
      const config = await this.getConfiguration(tenantId);
      return config?.endpoint || null;
    }
  }

  /**
   * Save entire configuration (for updating settings like reconnectInterval, autoReconnect, etc)
   */
  async saveConfiguration(config: WhatsAppConfiguration): Promise<void> {
    try {
      const configKey = `whatsapp:config:${config.tenantId}`;
      // Ensure all dates are properly serialized for storage
      const configToStore = {
        ...config,
        updatedAt: new Date(),
        createdAt: config.createdAt instanceof Date ? config.createdAt : new Date(config.createdAt),
        endpoint: {
          ...config.endpoint,
          lastHealthCheck: config.endpoint.lastHealthCheck instanceof Date ? config.endpoint.lastHealthCheck : new Date(config.endpoint.lastHealthCheck),
          createdAt: config.endpoint.createdAt instanceof Date ? config.endpoint.createdAt : new Date(config.endpoint.createdAt),
          updatedAt: config.endpoint.updatedAt instanceof Date ? config.endpoint.updatedAt : new Date(config.endpoint.updatedAt),
        }
      };
      await kvSet(configKey, configToStore);
      
      // Invalidate clients if needed
      await this.invalidateClient(config.tenantId);
    } catch (error) {
      console.error('Error saving WhatsApp configuration:', error);
      throw error;
    }
  }

  /**
   * Set or update endpoint for a tenant (replaces existing if any)
   * Saves to database for persistence
   */
  async setEndpoint(tenantId: string, endpoint: Omit<WhatsAppEndpoint, 'createdAt' | 'updatedAt'>): Promise<WhatsAppEndpoint> {
    try {
      // Check if endpoint already exists
      const { data: existingEndpoint } = await this.supabase
        .from('whatsapp_endpoints')
        .select('*')
        .eq('tenant_id', tenantId)
        .single();

      const now = new Date().toISOString();
      const endpointData = {
        id: endpoint.id || existingEndpoint?.id || `ep_${Date.now()}`,
        tenant_id: tenantId,
        name: endpoint.name,
        api_url: endpoint.apiUrl,
        api_key: endpoint.apiKey,
        webhook_url: endpoint.webhookUrl,
        webhook_secret: endpoint.webhookSecret,
        is_active: endpoint.isActive ?? true,
        health_status: endpoint.healthStatus || 'unknown',
        last_health_check: endpoint.lastHealthCheck instanceof Date ? endpoint.lastHealthCheck.toISOString() : endpoint.lastHealthCheck || now,
        updated_at: now,
      };

      let savedEndpoint;

      if (existingEndpoint) {
        // Update existing
        const { data, error } = await this.supabase
          .from('whatsapp_endpoints')
          .update(endpointData)
          .eq('tenant_id', tenantId)
          .select()
          .single();

        if (error) throw error;
        savedEndpoint = data;
      } else {
        // Create new
        const { data, error } = await this.supabase
          .from('whatsapp_endpoints')
          .insert([{ ...endpointData, created_at: now }])
          .select()
          .single();

        if (error) throw error;
        savedEndpoint = data;
      }

      // Map database record back to WhatsAppEndpoint
      const newEndpoint: WhatsAppEndpoint = {
        id: savedEndpoint.id,
        tenantId: savedEndpoint.tenant_id,
        name: savedEndpoint.name,
        apiUrl: savedEndpoint.api_url,
        apiKey: savedEndpoint.api_key,
        webhookUrl: savedEndpoint.webhook_url,
        webhookSecret: savedEndpoint.webhook_secret,
        isActive: savedEndpoint.is_active,
        healthStatus: savedEndpoint.health_status,
        lastHealthCheck: new Date(savedEndpoint.last_health_check),
        createdAt: new Date(savedEndpoint.created_at),
        updatedAt: new Date(savedEndpoint.updated_at),
      };

      // Also update cache
      const nowDate = new Date();
      const config = await this.getConfiguration(tenantId) || {
        tenantId,
        endpoint: newEndpoint,
        autoReconnect: true,
        reconnectInterval: 30,
        healthCheckInterval: 60,
        webhookRetries: 3,
        messageTimeout: 30,
        createdAt: nowDate,
        updatedAt: nowDate,
      };

      config.endpoint = newEndpoint;
      config.updatedAt = nowDate;

      const configKey = `whatsapp:config:${tenantId}`;
      await kvSet(configKey, config);

      // Update client
      await this.invalidateClient(tenantId);
      await this.startHealthMonitoring(tenantId);

      return newEndpoint;
    } catch (error) {
      console.error('Error setting WhatsApp endpoint:', error);
      throw error;
    }
  }

  /**
   * Delete endpoint for a tenant
   */
  async deleteEndpoint(tenantId: string): Promise<void> {
    try {
      // Delete from database
      const { error } = await this.supabase
        .from('whatsapp_endpoints')
        .delete()
        .eq('tenant_id', tenantId);

      if (error) throw error;

      // Delete from cache
      const configKey = `whatsapp:config:${tenantId}`;
      await kvDelete(configKey);

      this.clients.delete(tenantId);
      await this.stopHealthMonitoring(tenantId);
    } catch (error) {
      console.error('Error deleting WhatsApp endpoint:', error);
      throw error;
    }
  }

  /**
   * Get WhatsApp client for a tenant
   * Since each tenant has exactly one endpoint, just return that endpoint's client
   */
  async getClient(tenantId: string): Promise<WhatsAppClient | null> {
    try {
      const config = await this.getConfiguration(tenantId);
      if (!config?.endpoint || !config.endpoint.isActive) {
        return null;
      }

      // Check if client already exists
      if (this.clients.has(tenantId)) {
        return this.clients.get(tenantId) || null;
      }

      // Create new client for this tenant's endpoint
      const clientConfig: WhatsAppEndpointConfig = {
        apiUrl: config.endpoint.apiUrl,
        apiKey: config.endpoint.apiKey,
        timeout: config.messageTimeout * 1000,
        retries: config.webhookRetries,
      };

      const client = new WhatsAppClient(clientConfig, tenantId, config.endpoint.id);
      this.clients.set(tenantId, client);

      return client;
    } catch (error) {
      console.error('Error getting WhatsApp client:', error);
      return null;
    }
  }

  /**
   * Invalidate cached client
   */
  private async invalidateClient(tenantId: string): Promise<void> {
    this.clients.delete(tenantId);
  }

  /**
   * Start health monitoring for tenant's endpoint
   */
  private async startHealthMonitoring(tenantId: string): Promise<void> {
    try {
      const config = await this.getConfiguration(tenantId);
      if (!config) return;

      // Clear existing interval if any
      if (this.healthCheckIntervals.has(tenantId)) {
        clearInterval(this.healthCheckIntervals.get(tenantId));
      }

      // Start new health check interval
      const interval = setInterval(async () => {
        await this.performHealthCheck(tenantId);
      }, config.healthCheckInterval * 1000);

      this.healthCheckIntervals.set(tenantId, interval);
    } catch (error) {
      console.error('Error starting health monitoring:', error);
    }
  }

  /**
   * Stop health monitoring for tenant
   */
  private async stopHealthMonitoring(tenantId: string): Promise<void> {
    if (this.healthCheckIntervals.has(tenantId)) {
      clearInterval(this.healthCheckIntervals.get(tenantId));
      this.healthCheckIntervals.delete(tenantId);
    }
  }

  /**
   * Perform health check for tenant's endpoint
   */
  private async performHealthCheck(tenantId: string): Promise<void> {
    try {
      const config = await this.getConfiguration(tenantId);
      if (!config?.endpoint) return;

      const client = await this.getClient(tenantId);
      if (!client) {
        config.endpoint.healthStatus = 'unhealthy';
      } else {
        const isHealthy = await client.healthCheck();
        config.endpoint.healthStatus = isHealthy ? 'healthy' : 'unhealthy';
      }

      config.endpoint.lastHealthCheck = new Date();
      config.updatedAt = new Date();

      const configKey = `whatsapp:config:${tenantId}`;
      await kvSet(configKey, config);
    } catch (error) {
      console.error(`Health check failed for tenant ${tenantId}:`, error);
      const config = await this.getConfiguration(tenantId);
      if (config?.endpoint) {
        config.endpoint.healthStatus = 'unhealthy';
        config.endpoint.lastHealthCheck = new Date();
        const configKey = `whatsapp:config:${tenantId}`;
        await kvSet(configKey, config);
      }
    }
  }

  /**
   * Test endpoint connectivity
   */
  async testEndpointHealth(tenantId: string): Promise<boolean> {
    try {
      const client = await this.getClient(tenantId);
      if (!client) return false;

      return await client.healthCheck();
    } catch (error) {
      console.error('Error testing endpoint health:', error);
      return false;
    }
  }

  /**
   * Initialize WhatsApp for a tenant (create empty config)
   */
  async initializeTenant(tenantId: string): Promise<void> {
    try {
      const existing = await this.getConfiguration(tenantId);
      if (existing) {
        return; // Already initialized
      }

      const configKey = `whatsapp:config:${tenantId}`;
      const config: WhatsAppConfiguration = {
        tenantId,
        endpoint: {
          id: '',
          tenantId,
          name: '',
          apiUrl: '',
          webhookUrl: '',
          webhookSecret: '',
          isActive: false,
          healthStatus: 'unknown',
          lastHealthCheck: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        autoReconnect: true,
        reconnectInterval: 30,
        healthCheckInterval: 60,
        webhookRetries: 3,
        messageTimeout: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await kvSet(configKey, config);
    } catch (error) {
      console.error('Error initializing tenant:', error);
      throw error;
    }
  }

  /**
   * Shutdown all health monitoring and cleanup resources
   */
  async shutdown(): Promise<void> {
    try {
      // Stop all health monitoring intervals
      for (const [tenantId, interval] of this.healthCheckIntervals) {
        clearInterval(interval);
      }
      this.healthCheckIntervals.clear();

      // Clear all cached clients
      this.clients.clear();

      console.log('WhatsApp endpoint manager shutdown complete');
    } catch (error) {
      console.error('Error during endpoint manager shutdown:', error);
      throw error;
    }
  }
}

export const whatsappEndpointManager = WhatsAppEndpointManager.getInstance();
