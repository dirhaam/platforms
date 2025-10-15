import {
  WhatsAppEndpoint,
  WhatsAppConfiguration,
  WhatsAppHealthCheck,
  WhatsAppEndpointConfig,
} from '@/types/whatsapp';
import { WhatsAppClient } from './whatsapp-client';
import { kvGet, kvSet } from '@/lib/cache/key-value-store';

export class WhatsAppEndpointManager {
  private static instance: WhatsAppEndpointManager;
  private clients: Map<string, WhatsAppClient> = new Map();
  private healthCheckIntervals: Map<string, NodeJS.Timeout> = new Map();

  static getInstance(): WhatsAppEndpointManager {
    if (!WhatsAppEndpointManager.instance) {
      WhatsAppEndpointManager.instance = new WhatsAppEndpointManager();
    }
    return WhatsAppEndpointManager.instance;
  }

  async getConfiguration(tenantId: string): Promise<WhatsAppConfiguration | null> {
    try {
      const configKey = `whatsapp:config:${tenantId}`;
      const rawConfig = await kvGet<WhatsAppConfiguration>(configKey);

      if (!rawConfig) {
        return null;
      }

      return {
        ...rawConfig,
        createdAt: new Date(rawConfig.createdAt),
        updatedAt: new Date(rawConfig.updatedAt),
        endpoints: rawConfig.endpoints.map(endpoint => ({
          ...endpoint,
          createdAt: new Date(endpoint.createdAt),
          updatedAt: new Date(endpoint.updatedAt),
          lastHealthCheck: endpoint.lastHealthCheck ? new Date(endpoint.lastHealthCheck) : new Date(),
        })),
      };
    } catch (error) {
      console.error('Error getting WhatsApp configuration:', error);
      return null;
    }
  }

  async saveConfiguration(config: WhatsAppConfiguration): Promise<void> {
    try {
      const configKey = `whatsapp:config:${config.tenantId}`;
      await kvSet(configKey, config);
      
      // Update clients for this tenant
      await this.updateTenantClients(config.tenantId);
    } catch (error) {
      console.error('Error saving WhatsApp configuration:', error);
      throw error;
    }
  }

  async addEndpoint(tenantId: string, endpoint: Omit<WhatsAppEndpoint, 'id' | 'createdAt' | 'updatedAt'>): Promise<WhatsAppEndpoint> {
    try {
      const config = await this.getConfiguration(tenantId) || {
        tenantId,
        endpoints: [],
        failoverEnabled: true,
        autoReconnect: true,
        reconnectInterval: 30,
        healthCheckInterval: 60,
        webhookRetries: 3,
        messageTimeout: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newEndpoint: WhatsAppEndpoint = {
        ...endpoint,
        id: `endpoint_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // If this is the first endpoint or marked as primary, set it as primary
      if (config.endpoints.length === 0 || endpoint.isPrimary) {
        // Remove primary flag from other endpoints
        config.endpoints.forEach(ep => ep.isPrimary = false);
        newEndpoint.isPrimary = true;
        config.primaryEndpointId = newEndpoint.id;
      }

      config.endpoints.push(newEndpoint);
      config.updatedAt = new Date();

      await this.saveConfiguration(config);
      await this.startHealthMonitoring(newEndpoint);

      return newEndpoint;
    } catch (error) {
      console.error('Error adding WhatsApp endpoint:', error);
      throw error;
    }
  }

  async updateEndpoint(tenantId: string, endpointId: string, updates: Partial<WhatsAppEndpoint>): Promise<WhatsAppEndpoint> {
    try {
      const config = await this.getConfiguration(tenantId);
      if (!config) {
        throw new Error('WhatsApp configuration not found');
      }

      const endpointIndex = config.endpoints.findIndex(ep => ep.id === endpointId);
      if (endpointIndex === -1) {
        throw new Error('Endpoint not found');
      }

      const updatedEndpoint = {
        ...config.endpoints[endpointIndex],
        ...updates,
        updatedAt: new Date()
      };

      config.endpoints[endpointIndex] = updatedEndpoint;
      config.updatedAt = new Date();

      // Handle primary endpoint changes
      if (updates.isPrimary) {
        config.endpoints.forEach(ep => {
          if (ep.id !== endpointId) {
            ep.isPrimary = false;
          }
        });
        config.primaryEndpointId = endpointId;
      }

      await this.saveConfiguration(config);
      await this.updateTenantClients(tenantId);

      return updatedEndpoint;
    } catch (error) {
      console.error('Error updating WhatsApp endpoint:', error);
      throw error;
    }
  }

  async removeEndpoint(tenantId: string, endpointId: string): Promise<void> {
    try {
      const config = await this.getConfiguration(tenantId);
      if (!config) {
        throw new Error('WhatsApp configuration not found');
      }

      const endpointIndex = config.endpoints.findIndex(ep => ep.id === endpointId);
      if (endpointIndex === -1) {
        throw new Error('Endpoint not found');
      }

      const endpoint = config.endpoints[endpointIndex];
      config.endpoints.splice(endpointIndex, 1);

      // If this was the primary endpoint, set another as primary
      if (endpoint.isPrimary && config.endpoints.length > 0) {
        config.endpoints[0].isPrimary = true;
        config.primaryEndpointId = config.endpoints[0].id;
      } else if (config.endpoints.length === 0) {
        config.primaryEndpointId = undefined;
      }

      config.updatedAt = new Date();

      await this.saveConfiguration(config);
      await this.stopHealthMonitoring(endpointId);
      this.clients.delete(`${tenantId}:${endpointId}`);
    } catch (error) {
      console.error('Error removing WhatsApp endpoint:', error);
      throw error;
    }
  }

  async getClient(tenantId: string, endpointId?: string): Promise<WhatsAppClient | null> {
    try {
      const config = await this.getConfiguration(tenantId);
      if (!config || config.endpoints.length === 0) {
        return null;
      }

      let targetEndpoint: WhatsAppEndpoint | undefined;

      if (endpointId) {
        targetEndpoint = config.endpoints.find(ep => ep.id === endpointId && ep.isActive);
      } else {
        // Get primary endpoint or first active endpoint
        targetEndpoint = config.endpoints.find(ep => ep.isPrimary && ep.isActive) ||
                       config.endpoints.find(ep => ep.isActive);
      }

      if (!targetEndpoint) {
        return null;
      }

      const clientKey = `${tenantId}:${targetEndpoint.id}`;
      
      if (!this.clients.has(clientKey)) {
        const clientConfig: WhatsAppEndpointConfig = {
          apiUrl: targetEndpoint.apiUrl,
          apiKey: targetEndpoint.apiKey,
          timeout: config.messageTimeout * 1000,
          retries: config.webhookRetries
        };

        const client = new WhatsAppClient(clientConfig, tenantId, targetEndpoint.id);
        this.clients.set(clientKey, client);
      }

      return this.clients.get(clientKey) || null;
    } catch (error) {
      console.error('Error getting WhatsApp client:', error);
      return null;
    }
  }

  async getHealthyClient(tenantId: string): Promise<WhatsAppClient | null> {
    try {
      const config = await this.getConfiguration(tenantId);
      if (!config || config.endpoints.length === 0) {
        return null;
      }

      // Try primary endpoint first
      const primaryEndpoint = config.endpoints.find(ep => ep.isPrimary && ep.isActive);
      if (primaryEndpoint && primaryEndpoint.healthStatus === 'healthy') {
        return await this.getClient(tenantId, primaryEndpoint.id);
      }

      // Fallback to any healthy endpoint
      const healthyEndpoint = config.endpoints.find(ep => 
        ep.isActive && ep.healthStatus === 'healthy'
      );

      if (healthyEndpoint) {
        return await this.getClient(tenantId, healthyEndpoint.id);
      }

      // If no healthy endpoints, try the primary anyway
      if (primaryEndpoint) {
        return await this.getClient(tenantId, primaryEndpoint.id);
      }

      return null;
    } catch (error) {
      console.error('Error getting healthy WhatsApp client:', error);
      return null;
    }
  }

  async performHealthCheck(endpoint: WhatsAppEndpoint): Promise<WhatsAppHealthCheck> {
    const startTime = Date.now();
    
    try {
      const clientConfig: WhatsAppEndpointConfig = {
        apiUrl: endpoint.apiUrl,
        apiKey: endpoint.apiKey,
        timeout: 10000, // 10 second timeout for health checks
        retries: 1
      };

      const client = new WhatsAppClient(clientConfig, endpoint.tenantId, endpoint.id);
      const isHealthy = await client.healthCheck();
      
      const responseTime = Date.now() - startTime;

      return {
        endpointId: endpoint.id,
        tenantId: endpoint.tenantId,
        status: isHealthy ? 'healthy' : 'unhealthy',
        responseTime,
        checkedAt: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        endpointId: endpoint.id,
        tenantId: endpoint.tenantId,
        status: 'unhealthy',
        responseTime,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        checkedAt: new Date()
      };
    }
  }

  async startHealthMonitoring(endpoint: WhatsAppEndpoint): Promise<void> {
    const config = await this.getConfiguration(endpoint.tenantId);
    if (!config) return;

    const intervalId = setInterval(async () => {
      try {
        const healthCheck = await this.performHealthCheck(endpoint);
        
        // Update endpoint health status
        await this.updateEndpoint(endpoint.tenantId, endpoint.id, {
          healthStatus: healthCheck.status,
          lastHealthCheck: healthCheck.checkedAt
        });

        // Store health check result
        const healthKey = `whatsapp:health:${endpoint.id}`;
        await kvSet(healthKey, healthCheck, 3600);

        // Trigger failover if needed
        if (healthCheck.status === 'unhealthy' && endpoint.isPrimary && config.failoverEnabled) {
          await this.triggerFailover(endpoint.tenantId, endpoint.id);
        }
      } catch (error) {
        console.error('Error during health check:', error);
      }
    }, config.healthCheckInterval * 1000);

    this.healthCheckIntervals.set(endpoint.id, intervalId);
  }

  async stopHealthMonitoring(endpointId: string): Promise<void> {
    const intervalId = this.healthCheckIntervals.get(endpointId);
    if (intervalId) {
      clearInterval(intervalId);
      this.healthCheckIntervals.delete(endpointId);
    }
  }

  private async triggerFailover(tenantId: string, failedEndpointId: string): Promise<void> {
    try {
      const config = await this.getConfiguration(tenantId);
      if (!config || !config.failoverEnabled) return;

      // Find a healthy backup endpoint
      const backupEndpoint = config.endpoints.find(ep => 
        ep.id !== failedEndpointId && 
        ep.isActive && 
        ep.healthStatus === 'healthy'
      );

      if (backupEndpoint) {
        // Switch primary to backup endpoint
        await this.updateEndpoint(tenantId, failedEndpointId, { isPrimary: false });
        await this.updateEndpoint(tenantId, backupEndpoint.id, { isPrimary: true });

        console.log(`Failover triggered for tenant ${tenantId}: ${failedEndpointId} -> ${backupEndpoint.id}`);
      }
    } catch (error) {
      console.error('Error during failover:', error);
    }
  }

  private async updateTenantClients(tenantId: string): Promise<void> {
    // Remove existing clients for this tenant
    const keysToRemove = Array.from(this.clients.keys()).filter(key => key.startsWith(`${tenantId}:`));
    keysToRemove.forEach(key => this.clients.delete(key));

    // Restart health monitoring for all endpoints
    const config = await this.getConfiguration(tenantId);
    if (config) {
      for (const endpoint of config.endpoints) {
        await this.stopHealthMonitoring(endpoint.id);
        if (endpoint.isActive) {
          await this.startHealthMonitoring(endpoint);
        }
      }
    }
  }

  async initializeTenant(tenantId: string): Promise<void> {
    try {
      const config = await this.getConfiguration(tenantId);
      if (config) {
        // Start health monitoring for all active endpoints
        for (const endpoint of config.endpoints) {
          if (endpoint.isActive) {
            await this.startHealthMonitoring(endpoint);
          }
        }
      }
    } catch (error) {
      console.error('Error initializing tenant WhatsApp configuration:', error);
    }
  }

  async shutdown(): Promise<void> {
    // Stop all health monitoring
    for (const [endpointId] of this.healthCheckIntervals) {
      await this.stopHealthMonitoring(endpointId);
    }
    
    // Clear all clients
    this.clients.clear();
  }
}