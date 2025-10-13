import { db } from '@/lib/database';
import {
  ServiceArea,
  CreateServiceAreaRequest,
  UpdateServiceAreaRequest,
  Coordinates,
  ServiceAreaBoundary,
} from '@/types/location';
import { serviceAreas, services } from '@/lib/database/schema';
import { eq, and, inArray } from 'drizzle-orm';

type ServiceAreaRow = typeof serviceAreas.$inferSelect;

export class ServiceAreaService {
  // Create a new service area
  static async createServiceArea(
    tenantId: string, 
    data: CreateServiceAreaRequest
  ): Promise<{ serviceArea?: ServiceArea; error?: string }> {
    try {
      // Validate boundaries
      const boundariesValidation = this.validateBoundaries(data.boundaries);
      if (!boundariesValidation.valid) {
        return { error: boundariesValidation.message };
      }

      // Validate available services exist
      if (data.availableServices.length > 0) {
        const dbServices = await db.select().from(services).where(
          and(
            eq(services.tenantId, tenantId),
            inArray(services.id, data.availableServices),
            eq(services.isActive, true)
          )
        );

        if (dbServices.length !== data.availableServices.length) {
          return { error: 'Some specified services do not exist or are inactive' };
        }
      }

      const [serviceArea] = await db.insert(serviceAreas).values({
        tenantId,
        name: data.name,
        description: data.description,
        boundaries: data.boundaries,
        baseTravelSurcharge: data.baseTravelSurcharge,
        perKmSurcharge: data.perKmSurcharge,
        maxTravelDistance: data.maxTravelDistance,
        estimatedTravelTime: data.estimatedTravelTime,
        availableServices: data.availableServices,
        isActive: true
      } as any).returning();

      return { serviceArea: this.mapServiceAreaRow(serviceArea) };
    } catch (error) {
      console.error('Error creating service area:', error);
      return { error: 'Failed to create service area' };
    }
  }

  // Update a service area
  static async updateServiceArea(
    tenantId: string,
    serviceAreaId: string,
    data: UpdateServiceAreaRequest
  ): Promise<{ serviceArea?: ServiceArea; error?: string }> {
    try {
      // Check if service area exists and belongs to tenant
      const existingServiceArea = await db.select().from(serviceAreas).where(
        and(
          eq(serviceAreas.id, serviceAreaId),
          eq(serviceAreas.tenantId, tenantId)
        )
      ).limit(1);

      if (existingServiceArea.length === 0) {
        return { error: 'Service area not found' };
      }

      const updateData: any = {};

      if (data.name !== undefined) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.isActive !== undefined) updateData.isActive = data.isActive;
      if (data.baseTravelSurcharge !== undefined) updateData.baseTravelSurcharge = data.baseTravelSurcharge;
      if (data.perKmSurcharge !== undefined) updateData.perKmSurcharge = data.perKmSurcharge;
      if (data.maxTravelDistance !== undefined) updateData.maxTravelDistance = data.maxTravelDistance;
      if (data.estimatedTravelTime !== undefined) updateData.estimatedTravelTime = data.estimatedTravelTime;

      // Validate boundaries if provided
      if (data.boundaries) {
        const boundariesValidation = this.validateBoundaries(data.boundaries);
        if (!boundariesValidation.valid) {
          return { error: boundariesValidation.message };
        }
        updateData.boundaries = data.boundaries;
      }

      // Validate available services if provided
      if (data.availableServices) {
        if (data.availableServices.length > 0) {
          const dbServices = await db.select().from(services).where(
            and(
              eq(services.tenantId, tenantId),
              inArray(services.id, data.availableServices),
              eq(services.isActive, true)
            )
          );

          if (dbServices.length !== data.availableServices.length) {
            return { error: 'Some specified services do not exist or are inactive' };
          }
        }
        updateData.availableServices = data.availableServices;
      }

      const [serviceArea] = await db.update(serviceAreas).set(updateData as any)
        .where(eq(serviceAreas.id, serviceAreaId))
        .returning();

      return { serviceArea: this.mapServiceAreaRow(serviceArea) };
    } catch (error) {
      console.error('Error updating service area:', error);
      return { error: 'Failed to update service area' };
    }
  }

  // Get service areas for a tenant
  static async getServiceAreas(
    tenantId: string,
    options: {
      includeInactive?: boolean;
      serviceId?: string;
    } = {}
  ): Promise<ServiceArea[]> {
    try {
      let serviceAreaRows: ServiceAreaRow[];

      if (options.includeInactive) {
        serviceAreaRows = await db
          .select()
          .from(serviceAreas)
          .where(eq(serviceAreas.tenantId, tenantId))
          .orderBy(serviceAreas.name);
      } else {
        serviceAreaRows = await db
          .select()
          .from(serviceAreas)
          .where(
            and(eq(serviceAreas.tenantId, tenantId), eq(serviceAreas.isActive, true))
          )
          .orderBy(serviceAreas.name);
      }

      if (options.serviceId) {
        serviceAreaRows = serviceAreaRows.filter(row => row.availableServices?.includes(options.serviceId!) ?? false);
      }

      return serviceAreaRows.map(row => this.mapServiceAreaRow(row));
    } catch (error) {
      console.error('Error fetching service areas:', error);
      return [];
    }
  }

  // Get a single service area
  static async getServiceArea(tenantId: string, serviceAreaId: string): Promise<ServiceArea | null> {
    try {
      const [serviceArea] = await db.select().from(serviceAreas).where(
        and(
          eq(serviceAreas.id, serviceAreaId),
          eq(serviceAreas.tenantId, tenantId)
        )
      ).limit(1);

      return serviceArea ? this.mapServiceAreaRow(serviceArea) : null;
    } catch (error) {
      console.error('Error fetching service area:', error);
      return null;
    }
  }

  // Delete a service area
  static async deleteServiceArea(
    tenantId: string, 
    serviceAreaId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const [serviceArea] = await db.select().from(serviceAreas).where(
        and(
          eq(serviceAreas.id, serviceAreaId),
          eq(serviceAreas.tenantId, tenantId)
        )
      ).limit(1);

      if (!serviceArea) {
        return { success: false, error: 'Service area not found' };
      }

      await db.delete(serviceAreas).where(eq(serviceAreas.id, serviceAreaId));

      return { success: true };
    } catch (error) {
      console.error('Error deleting service area:', error);
      return { success: false, error: 'Failed to delete service area' };
    }
  }

  // Check if coordinates are within a service area
  static isPointInServiceArea(coordinates: Coordinates, serviceArea: ServiceArea): boolean {
    const { boundaries } = serviceArea;

    if (boundaries.type === 'circle') {
      if (!boundaries.center || !boundaries.radius) return false;
      
      const distance = this.calculateDistance(coordinates, boundaries.center);
      return distance <= boundaries.radius;
    }

    if (boundaries.type === 'polygon') {
      if (!boundaries.coordinates || boundaries.coordinates.length < 3) return false;
      
      return this.isPointInPolygon(coordinates, boundaries.coordinates);
    }

    return false;
  }

  // Find service areas that cover a specific location
  static async findServiceAreasForLocation(
    tenantId: string,
    coordinates: Coordinates,
    serviceId?: string
  ): Promise<ServiceArea[]> {
    try {
      const serviceAreas = await this.getServiceAreas(tenantId, { serviceId });
      
      return serviceAreas.filter(area => 
        this.isPointInServiceArea(coordinates, area)
      );
    } catch (error) {
      console.error('Error finding service areas for location:', error);
      return [];
    }
  }

  // Calculate surcharge for a location
  static async calculateSurcharge(
    tenantId: string,
    coordinates: Coordinates,
    distance: number,
    serviceId?: string
  ): Promise<{ surcharge: number; serviceAreaId?: string }> {
    try {
      const serviceAreas = await this.findServiceAreasForLocation(tenantId, coordinates, serviceId);
      
      if (serviceAreas.length === 0) {
        return { surcharge: 0 };
      }

      // Use the first matching service area (could be enhanced to choose the best one)
      const serviceArea = serviceAreas[0];
      let surcharge = serviceArea.baseTravelSurcharge;

      if (serviceArea.perKmSurcharge && distance > 0) {
        surcharge += distance * serviceArea.perKmSurcharge;
      }

      return { 
        surcharge, 
        serviceAreaId: serviceArea.id 
      };
    } catch (error) {
      console.error('Error calculating surcharge:', error);
      return { surcharge: 0 };
    }
  }

  // Private helper methods

  private static mapServiceAreaRow(row: ServiceAreaRow): ServiceArea {
    return {
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      description: row.description ?? undefined,
      isActive: row.isActive ?? false,
      boundaries: row.boundaries as ServiceAreaBoundary,
      baseTravelSurcharge: Number(row.baseTravelSurcharge ?? 0),
      perKmSurcharge:
        row.perKmSurcharge !== null && row.perKmSurcharge !== undefined
          ? Number(row.perKmSurcharge)
          : undefined,
      maxTravelDistance: Number(row.maxTravelDistance ?? 0),
      estimatedTravelTime: Number(row.estimatedTravelTime ?? 0),
      availableServices: row.availableServices ?? [],
      createdAt: row.createdAt ?? new Date(),
      updatedAt: row.updatedAt ?? new Date(),
    };
  }

  private static validateBoundaries(boundaries: ServiceAreaBoundary): { valid: boolean; message?: string } {
    if (boundaries.type === 'circle') {
      if (!boundaries.center || !boundaries.radius) {
        return { valid: false, message: 'Circle boundaries require center coordinates and radius' };
      }
      if (boundaries.radius <= 0) {
        return { valid: false, message: 'Circle radius must be greater than 0' };
      }
      if (!this.isValidCoordinates(boundaries.center)) {
        return { valid: false, message: 'Invalid center coordinates' };
      }
    }

    if (boundaries.type === 'polygon') {
      if (!boundaries.coordinates || boundaries.coordinates.length < 3) {
        return { valid: false, message: 'Polygon boundaries require at least 3 coordinates' };
      }
      for (const coord of boundaries.coordinates) {
        if (!this.isValidCoordinates(coord)) {
          return { valid: false, message: 'Invalid polygon coordinates' };
        }
      }
    }

    return { valid: true };
  }

  private static isValidCoordinates(coordinates: Coordinates): boolean {
    return (
      typeof coordinates.lat === 'number' &&
      typeof coordinates.lng === 'number' &&
      coordinates.lat >= -90 &&
      coordinates.lat <= 90 &&
      coordinates.lng >= -180 &&
      coordinates.lng <= 180
    );
  }

  private static calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(coord2.lat - coord1.lat);
    const dLng = this.toRadians(coord2.lng - coord1.lng);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(coord1.lat)) * Math.cos(this.toRadians(coord2.lat)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  // Point in polygon algorithm (ray casting)
  private static isPointInPolygon(point: Coordinates, polygon: Coordinates[]): boolean {
    let inside = false;
    
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i].lng;
      const yi = polygon[i].lat;
      const xj = polygon[j].lng;
      const yj = polygon[j].lat;
      
      if (((yi > point.lat) !== (yj > point.lat)) &&
          (point.lng < (xj - xi) * (point.lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }
    
    return inside;
  }
}