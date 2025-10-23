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

import { WhatsAppEndpoint } from '@/types/whatsapp';

export interface EnvEndpointConfig {
  name: string;
  apiUrl: string;
  apiKey: string;
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
   * Format: [{"name":"Primary","apiUrl":"...","apiKey":"..."}]
   */
  private loadFromEnv(): void {
    try {
      const endpointsJson = process.env.WHATSAPP_ENDPOINTS || '[]';
      const endpoints: EnvEndpointConfig[] = JSON.parse(endpointsJson);

      this.envEndpoints.clear();
      endpoints.forEach((endpoint) => {
        this.envEndpoints.set(endpoint.name.toLowerCase(), endpoint);
      });

      console.log(`✓ Loaded ${endpoints.length} WhatsApp endpoints from ENV`);
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
}

export const envEndpointManager = EnvEndpointManager.getInstance();
