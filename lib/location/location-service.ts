import { 
  Address, 
  Coordinates, 
  AddressValidation, 
  TravelCalculation, 
  RouteOptimization,
  ValidateAddressRequest,
  CalculateTravelRequest,
  OptimizeRouteRequest,
  LocationServiceConfig,
  LocationError,
  LocationErrorType
} from '@/types/location';
import { CacheService } from '@/lib/cache/cache-service';

export class LocationService {
  private static config: LocationServiceConfig = {
    geocodingProvider: 'nominatim', // Free option as default
    routingProvider: 'osrm', // Free option as default
    apiKeys: {},
    defaultCountry: 'ID', // Indonesia
    defaultLanguage: 'id',
    cacheEnabled: true,
    cacheTtl: 3600 // 1 hour
  };

  // Initialize with configuration
  static configure(config: Partial<LocationServiceConfig>) {
    this.config = { ...this.config, ...config };
  }

  // Validate and geocode an address
  static async validateAddress(request: ValidateAddressRequest): Promise<AddressValidation> {
    try {
      const cacheKey = `address_validation:${request.tenantId}:${request.address}`;
      
      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = await CacheService.get<AddressValidation>(cacheKey);
        if (cached) return cached;
      }

      const result = await this.geocodeAddress(request.address);
      
      // Cache the result
      if (this.config.cacheEnabled && result.isValid) {
        await CacheService.set(cacheKey, result, { ttl: this.config.cacheTtl });
      }

      return result;
    } catch (error) {
      console.error('Error validating address:', error);
      return {
        isValid: false,
        error: 'Failed to validate address'
      };
    }
  }

  // Calculate travel time and distance
  static async calculateTravel(request: CalculateTravelRequest): Promise<TravelCalculation> {
    try {
      const origin = await this.resolveLocation(request.origin);
      const destination = await this.resolveLocation(request.destination);

      if (!origin || !destination) {
        throw new Error('Invalid origin or destination coordinates');
      }

      const cacheKey = `travel_calc:${origin.lat},${origin.lng}:${destination.lat},${destination.lng}`;
      
      // Check cache first
      if (this.config.cacheEnabled) {
        const cached = await CacheService.get<TravelCalculation>(cacheKey);
        if (cached) return cached;
      }

      const result = await this.calculateRoute(origin, destination, request.tenantId, request.serviceId);
      
      // Cache the result
      if (this.config.cacheEnabled) {
        await CacheService.set(cacheKey, result, { ttl: this.config.cacheTtl });
      }

      return result;
    } catch (error) {
      console.error('Error calculating travel:', error);
      return {
        distance: 0,
        duration: 0,
        surcharge: 0,
        isWithinServiceArea: false
      };
    }
  }

  // Optimize route for multiple stops
  static async optimizeRoute(request: OptimizeRouteRequest): Promise<RouteOptimization> {
    try {
      const startCoords = await this.resolveLocation(request.startLocation);
      if (!startCoords) {
        throw new Error('Invalid start location');
      }

      // Resolve all booking coordinates
      const bookingsWithCoords = await Promise.all(
        request.bookings.map(async (booking) => {
          const coords = booking.coordinates || await this.resolveLocation(booking.address);
          return {
            ...booking,
            coordinates: coords
          };
        })
      );

      // Filter out bookings without valid coordinates
      const validBookings = bookingsWithCoords.filter(b => b.coordinates);

      if (validBookings.length === 0) {
        return {
          optimizedRoute: [],
          totalDistance: 0,
          totalDuration: 0,
          totalSurcharge: 0
        };
      }

      // Simple nearest neighbor optimization (can be enhanced with more sophisticated algorithms)
      const optimizedRoute = await this.nearestNeighborOptimization(startCoords, validBookings);
      
      return optimizedRoute;
    } catch (error) {
      console.error('Error optimizing route:', error);
      return {
        optimizedRoute: [],
        totalDistance: 0,
        totalDuration: 0,
        totalSurcharge: 0
      };
    }
  }

  // Private helper methods

  private static async geocodeAddress(address: string): Promise<AddressValidation> {
    switch (this.config.geocodingProvider) {
      case 'google':
        return this.geocodeWithGoogle(address);
      case 'mapbox':
        return this.geocodeWithMapbox(address);
      case 'nominatim':
      default:
        return this.geocodeWithNominatim(address);
    }
  }

  private static async geocodeWithNominatim(address: string): Promise<AddressValidation> {
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&countrycodes=${this.config.defaultCountry}&limit=5&addressdetails=1`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Booqing-Platform/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();

      if (!data || data.length === 0) {
        return {
          isValid: false,
          error: 'Address not found'
        };
      }

      const result = data[0];
      const parsedAddress: Address = {
        street: result.display_name.split(',')[0] || '',
        city: result.address?.city || result.address?.town || result.address?.village || '',
        state: result.address?.state || '',
        postalCode: result.address?.postcode || '',
        country: result.address?.country || this.config.defaultCountry,
        fullAddress: result.display_name,
        coordinates: {
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon)
        }
      };

      const suggestions = data.slice(1, 4).map((item: any) => ({
        street: item.display_name.split(',')[0] || '',
        city: item.address?.city || item.address?.town || item.address?.village || '',
        state: item.address?.state || '',
        postalCode: item.address?.postcode || '',
        country: item.address?.country || this.config.defaultCountry,
        fullAddress: item.display_name,
        coordinates: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        }
      }));

      return {
        isValid: true,
        address: parsedAddress,
        suggestions,
        confidence: parseFloat(result.importance) || 0.5
      };
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
      return {
        isValid: false,
        error: 'Geocoding service unavailable'
      };
    }
  }

  private static async geocodeWithGoogle(address: string): Promise<AddressValidation> {
    // Implementation for Google Geocoding API
    // This would require a Google API key
    throw new Error('Google geocoding not implemented yet');
  }

  private static async geocodeWithMapbox(address: string): Promise<AddressValidation> {
    // Implementation for Mapbox Geocoding API
    // This would require a Mapbox API key
    throw new Error('Mapbox geocoding not implemented yet');
  }

  private static async calculateRoute(
    origin: Coordinates, 
    destination: Coordinates, 
    tenantId: string, 
    serviceId?: string
  ): Promise<TravelCalculation> {
    try {
      // Calculate straight-line distance first
      const straightLineDistance = this.calculateHaversineDistance(origin, destination);
      
      // Get routing information
      const routeInfo = await this.getRouteInfo(origin, destination);
      
      // Check service area coverage
      const serviceAreaCheck = await this.checkServiceAreaCoverage(
        destination, 
        tenantId, 
        serviceId
      );

      return {
        distance: routeInfo?.distance || straightLineDistance,
        duration: routeInfo?.duration || Math.ceil(straightLineDistance * 2), // Rough estimate: 2 min per km
        route: routeInfo?.route,
        surcharge: serviceAreaCheck.surcharge,
        isWithinServiceArea: serviceAreaCheck.isWithinArea,
        serviceAreaId: serviceAreaCheck.serviceAreaId
      };
    } catch (error) {
      console.error('Error calculating route:', error);
      // Fallback to straight-line calculation
      const distance = this.calculateHaversineDistance(origin, destination);
      return {
        distance,
        duration: Math.ceil(distance * 2),
        surcharge: 0,
        isWithinServiceArea: false
      };
    }
  }

  private static async getRouteInfo(origin: Coordinates, destination: Coordinates) {
    switch (this.config.routingProvider) {
      case 'google':
        return this.getRouteWithGoogle(origin, destination);
      case 'mapbox':
        return this.getRouteWithMapbox(origin, destination);
      case 'osrm':
      default:
        return this.getRouteWithOSRM(origin, destination);
    }
  }

  private static async getRouteWithOSRM(origin: Coordinates, destination: Coordinates) {
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=simplified&geometries=geojson`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      
      return {
        distance: route.distance / 1000, // Convert to kilometers
        duration: Math.ceil(route.duration / 60), // Convert to minutes
        route: route.geometry?.coordinates?.map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0]
        }))
      };
    } catch (error) {
      console.error('OSRM routing error:', error);
      return null;
    }
  }

  private static async getRouteWithGoogle(origin: Coordinates, destination: Coordinates) {
    // Implementation for Google Directions API
    throw new Error('Google routing not implemented yet');
  }

  private static async getRouteWithMapbox(origin: Coordinates, destination: Coordinates) {
    // Implementation for Mapbox Directions API
    throw new Error('Mapbox routing not implemented yet');
  }

  private static async checkServiceAreaCoverage(
    coordinates: Coordinates, 
    tenantId: string, 
    serviceId?: string
  ) {
    // This would check against the service areas in the database
    // For now, return a default response
    return {
      isWithinArea: true,
      surcharge: 0,
      serviceAreaId: undefined
    };
  }

  private static calculateHaversineDistance(coord1: Coordinates, coord2: Coordinates): number {
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

  private static async resolveLocation(location: Coordinates | string): Promise<Coordinates | null> {
    if (typeof location === 'object' && location.lat && location.lng) {
      return location;
    }
    
    if (typeof location === 'string') {
      const validation = await this.geocodeAddress(location);
      return validation.address?.coordinates || null;
    }
    
    return null;
  }

  private static async nearestNeighborOptimization(
    startLocation: Coordinates,
    bookings: Array<{
      id: string;
      address: string;
      coordinates: Coordinates | null;
      serviceTime: number;
      scheduledAt: Date;
    }>
  ): Promise<RouteOptimization> {
    const route = [];
    const unvisited = [...bookings.filter(b => b.coordinates)];
    let currentLocation = startLocation;
    let totalDistance = 0;
    let totalDuration = 0;
    let totalSurcharge = 0;
    let currentTime = new Date();

    while (unvisited.length > 0) {
      // Find nearest unvisited booking
      let nearestIndex = 0;
      let nearestDistance = Infinity;

      for (let i = 0; i < unvisited.length; i++) {
        const booking = unvisited[i];
        if (!booking.coordinates) continue;

        const distance = this.calculateHaversineDistance(currentLocation, booking.coordinates);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = i;
        }
      }

      const nearestBooking = unvisited[nearestIndex];
      if (!nearestBooking.coordinates) break;

      // Calculate travel time (rough estimate: 2 minutes per km + 5 minutes buffer)
      const travelTime = Math.ceil(nearestDistance * 2) + 5;
      currentTime = new Date(currentTime.getTime() + travelTime * 60000);

      route.push({
        bookingId: nearestBooking.id,
        address: nearestBooking.address,
        coordinates: nearestBooking.coordinates,
        estimatedArrival: new Date(currentTime),
        serviceTime: nearestBooking.serviceTime,
        travelTimeFromPrevious: travelTime,
        distanceFromPrevious: nearestDistance
      });

      // Update totals
      totalDistance += nearestDistance;
      totalDuration += travelTime + nearestBooking.serviceTime;
      // Simple surcharge calculation: 5000 IDR per km
      totalSurcharge += nearestDistance * 5000;

      // Move to next location
      currentLocation = nearestBooking.coordinates;
      currentTime = new Date(currentTime.getTime() + nearestBooking.serviceTime * 60000);

      // Remove from unvisited
      unvisited.splice(nearestIndex, 1);
    }

    return {
      optimizedRoute: route,
      totalDistance,
      totalDuration,
      totalSurcharge
    };
  }
}