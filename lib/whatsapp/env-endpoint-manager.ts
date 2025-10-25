/**
 * Environment-based WhatsApp Endpoint Manager
 * 
 * Endpoints are defined in ENV variables, not in database/frontend
 * This ensures credentials never leave server-side config
 * 
 * Flow:
 * 1. Superadmin defines endpoints in ENV: WHATSAPP_ENDPOINTS
 * 2. Dashboard shows available endpoints
 * 3. Superadmin assigns endpoint to tenant
 * 4. Assignment stored in database (no credentials)
 * 5. Backend fetches credentials from ENV when needed
 */

import { Buffer } from 'node:buffer';

export interface EnvEndpointConfig {
  name: string;
  apiUrl: string;
  apiKey: string;
  authType: 'bearer' | 'basic';
}

export class EnvEndpointManager {
  private static instance: EnvEndpointManager;
  private envEndpoints: Map<string, EnvEndpointConfig> = new Map();

  static getInstance(): EnvEndpointManager {
    if (!EnvEndpointManager.instance) {
      EnvEndpointManager.instance = new EnvEndpointManager();
      EnvEndpointManager.instance.loadFromEnv();
    }
    return EnvEndpointManager.instance;
  }

  /**
   * Load endpoints from WHATSAPP_ENDPOINTS env var
   * Format: [{"name":"Primary","apiUrl":"...","apiKey":"..."}] or with username/password
   */
  private loadFromEnv(): void {
    try {
      const endpointsJson = process.env.WHATSAPP_ENDPOINTS || '[]';
      const endpoints = JSON.parse(endpointsJson) as Array<Record<string, any>>;

      this.envEndpoints.clear();
      endpoints.forEach((rawEndpoint) => {
        const normalized = this.normalizeEndpoint(rawEndpoint);
        if (normalized) {
          this.envEndpoints.set(normalized.name.toLowerCase(), normalized);
        }
      });

      console.log(`✓ Loaded ${this.envEndpoints.size} WhatsApp endpoints from ENV`);
    } catch (error) {
      console.error('Failed to parse WHATSAPP_ENDPOINTS:', error);
      this.envEndpoints.clear();
    }
  }

  /**
   * Get all available endpoint names
   */
  getAvailableEndpoints(): string[] {
    return Array.from(this.envEndpoints.keys()).map((key) => {
      const endpoint = this.envEndpoints.get(key);
      return endpoint?.name || key;
    });
  }

  /**
   * Get endpoint config by name (server-side only)
   * NEVER expose this to frontend!
   */
  getEndpointConfig(name: string): EnvEndpointConfig | null {
    return this.envEndpoints.get(name.toLowerCase()) || null;
  }

  /**
   * Get endpoint metadata only (safe for API responses)
   */
  getEndpointMetadata(name: string): { name: string; apiUrl: string } | null {
    const endpoint = this.envEndpoints.get(name.toLowerCase());
    if (!endpoint) return null;

    return {
      name: endpoint.name,
      apiUrl: endpoint.apiUrl,
      // IMPORTANT: Never include apiKey in any response!
    };
  }

  /**
   * Validate endpoint name exists
   */
  isValidEndpoint(name: string): boolean {
    return this.envEndpoints.has(name.toLowerCase());
  }

  /**
   * Reload endpoints from ENV (for development/testing)
   */
  reload(): void {
    this.loadFromEnv();
  }

  private normalizeEndpoint(raw: Record<string, any>): EnvEndpointConfig | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const name = typeof raw.name === 'string' ? raw.name.trim() : '';
    const apiUrl = typeof raw.apiUrl === 'string' ? raw.apiUrl.trim() : '';

    if (!name || !apiUrl) {
      console.warn('[WhatsApp Env] Invalid endpoint entry, missing name or apiUrl');
      return null;
    }

    const rawApiKey = typeof raw.apiKey === 'string' ? raw.apiKey.trim() : undefined;
    const username = typeof raw.username === 'string' ? raw.username : undefined;
    const password = typeof raw.password === 'string' ? raw.password : undefined;
    const declaredAuthType = typeof raw.authType === 'string' ? raw.authType.toLowerCase() : undefined;

    let authType: 'bearer' | 'basic';
    if (declaredAuthType === 'basic' || declaredAuthType === 'bearer') {
      authType = declaredAuthType;
    } else if (rawApiKey && /^basic\s/i.test(rawApiKey)) {
      authType = 'basic';
    } else if (username && password) {
      authType = 'basic';
    } else {
      authType = 'bearer';
    }

    let apiKey: string | undefined = rawApiKey;

    if (authType === 'basic') {
      if (apiKey && !/^basic\s/i.test(apiKey)) {
        console.warn(`[WhatsApp Env] Endpoint "${name}" provided basic authType but apiKey is not a Basic token. Falling back to username/password.`);
        apiKey = undefined;
      }

      if (!apiKey) {
        if (!username || !password) {
          console.warn(`[WhatsApp Env] Endpoint "${name}" missing username/password for basic authentication`);
          return null;
        }
        const encoded = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
        apiKey = `Basic ${encoded}`;
      }
    } else {
      if (!apiKey && username && password) {
        const encoded = Buffer.from(`${username}:${password}`, 'utf8').toString('base64');
        apiKey = `Basic ${encoded}`;
        authType = 'basic';
      } else if (apiKey) {
        if (!/^bearer\s/i.test(apiKey) && !/^basic\s/i.test(apiKey)) {
          apiKey = `Bearer ${apiKey}`;
        }
      } else {
        console.warn(`[WhatsApp Env] Endpoint "${name}" missing apiKey for bearer authentication`);
        return null;
      }
    }

    if (!apiKey) {
      console.warn(`[WhatsApp Env] Endpoint "${name}" missing credentials`);
      return null;
    }

    return {
      name,
      apiUrl,
      apiKey,
      authType,
    };
  }
}

export const envEndpointManager = EnvEndpointManager.getInstance();
