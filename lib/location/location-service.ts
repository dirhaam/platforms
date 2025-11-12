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
  LocationErrorType,
  TravelSurchargeSettings
} from '@/types/location';
import { CacheService } from '@/lib/cache/cache-service';
import { InvoiceSettingsService } from '@/lib/invoice/invoice-settings-service';
import { createClient } from '@supabase/supabase-js';

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
      console.log('[LocationService.calculateTravel] Request:', {
        origin: request.origin,
        destination: request.destination,
        tenantId: request.tenantId
      });
      
      const origin = await this.resolveLocation(request.origin);
      const destination = await this.resolveLocation(request.destination);

      console.log('[LocationService.calculateTravel] Resolved coordinates:', {
        origin,
        destination
      });

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
      console.error('[LocationService] Error calculating travel:', error);
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
      const optimizedRoute = await this.nearestNeighborOptimization(startCoords, validBookings, request.tenantId);
      
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
      
      console.log('[LocationService.geocodeWithNominatim] Geocoding:', { address, url });
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Booqing-Platform/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[LocationService.geocodeWithNominatim] Response data:', { count: data?.length, data });

      if (!data || data.length === 0) {
        console.warn('[LocationService.geocodeWithNominatim] No results for address:', address);
        return {
          isValid: false,
          error: 'Address not found'
        };
      }

      const result = data[0];
      const coordinates = {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon)
      };

      // Validate coordinates are within Indonesia
      if (!this.isValidIndonesiaCoordinate(coordinates)) {
        return {
          isValid: false,
          error: 'Address coordinates are outside of Indonesia'
        };
      }

      const parsedAddress: Address = {
        street: result.display_name.split(',')[0] || '',
        city: result.address?.city || result.address?.town || result.address?.village || '',
        state: result.address?.state || '',
        postalCode: result.address?.postcode || '',
        country: result.address?.country || this.config.defaultCountry,
        fullAddress: result.display_name,
        coordinates: coordinates
      };

      const suggestions = data.slice(1, 4).map((item: any) => {
        const suggestionCoords = {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        };

        // Only include suggestions with valid Indonesia coordinates
        if (!this.isValidIndonesiaCoordinate(suggestionCoords)) {
          return null; // Will be filtered out below
        }

        return {
          street: item.display_name.split(',')[0] || '',
          city: item.address?.city || item.address?.town || item.address?.village || '',
          state: item.address?.state || '',
          postalCode: item.address?.postcode || '',
          country: item.address?.country || this.config.defaultCountry,
          fullAddress: item.display_name,
          coordinates: suggestionCoords
        };
      }).filter(Boolean); // Remove null values

      return {
        isValid: true,
        address: parsedAddress,
        suggestions: suggestions as Address[],
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
      const actualDistance = routeInfo?.distance || straightLineDistance;
      
      // Check service area coverage
      const serviceAreaCheck = await this.checkServiceAreaCoverage(
        destination, 
        tenantId, 
        serviceId
      );
      
      console.log('[LocationService.calculateTravel] Service area check:', serviceAreaCheck);

      // Get travel surcharge settings from Invoice Settings
      let surcharge = serviceAreaCheck.surcharge;
      console.log('[LocationService.calculateTravel] Initial surcharge from service area:', surcharge);
      
      if (surcharge === 0) {
        // Use invoice settings travel surcharge if not in service area or no service area defined
        const invoiceSettings = await InvoiceSettingsService.getSettings(tenantId);
        console.log('[LocationService.calculateTravel] Invoice settings travel config:', invoiceSettings.travelSurcharge);
        
        if (invoiceSettings.travelSurcharge) {
          surcharge = this.calculateTravelSurcharge(
            actualDistance,
            invoiceSettings.travelSurcharge
          );
          console.log('[LocationService.calculateTravel] Calculated surcharge from invoice settings:', surcharge);
        }
      }

      // Apply buffer to the duration to account for traffic, stops, and real-world conditions
      const bufferedDuration = routeInfo?.duration 
        ? Math.ceil(routeInfo.duration * 1.2) // Add 20% buffer to OSRM time
        : Math.ceil(straightLineDistance * 2); // Fallback: 2 min per km

      return {
        distance: actualDistance,
        duration: bufferedDuration,
        route: routeInfo?.route,
        surcharge,
        isWithinServiceArea: serviceAreaCheck.isWithinArea,
        serviceAreaId: serviceAreaCheck.serviceAreaId
      };
    } catch (error) {
      console.error('[LocationService] Error calculating route:', error);
      // Fallback to straight-line calculation with buffer
      const distance = this.calculateHaversineDistance(origin, destination);
      return {
        distance,
        duration: Math.ceil(distance * 2.4), // Apply buffer to fallback time too
        surcharge: 0,
        isWithinServiceArea: false
      };
    }
  }

  private static calculateTravelSurcharge(
    distance: number,
    settings: TravelSurchargeSettings
  ): number {
    // Check if distance is within allowed range
    if (settings.minTravelDistance && distance < settings.minTravelDistance) {
      return 0; // No surcharge if under minimum distance
    }
    if (settings.maxTravelDistance && distance > settings.maxTravelDistance) {
      return 0; // Don't allow booking if exceeds max distance
    }

    // Calculate surcharge: base + (distance × per km rate)
    const calculatedSurcharge = settings.baseTravelSurcharge + (distance * settings.perKmSurcharge);
    return Math.ceil(calculatedSurcharge);
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
      const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
      
      console.log('[LocationService] Calling OSRM route:', { origin, destination, url });
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`OSRM API error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.routes || data.routes.length === 0) {
        throw new Error('No route found');
      }

      const route = data.routes[0];
      const polylineCoordinates = route.geometry?.coordinates?.map((coord: number[]) => ({
        lat: coord[1],
        lng: coord[0]
      })) || [];
      
      console.log('[LocationService] OSRM route success:', {
        distance: route.distance / 1000,
        duration: Math.ceil(route.duration / 60),
        polylinePoints: polylineCoordinates.length
      });
      
      return {
        distance: route.distance / 1000, // Convert to kilometers
        duration: Math.ceil(route.duration / 60), // Convert to minutes
        route: polylineCoordinates
      };
    } catch (error) {
      console.error('[LocationService] OSRM routing error:', error);
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
    // This checks against the service areas in the database
    // Check if coordinates are within any service area for this tenant
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );

      // Query service areas for tenant and optionally for a specific service
      let query = supabase
        .from('service_areas')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true);

      // Get all areas for this tenant
      const { data: allAreas } = await query;

      if (!allAreas || allAreas.length === 0) {
        // No service areas defined for this tenant, assume customer is within service area
        return {
          isWithinArea: true,
          surcharge: 0,
          serviceAreaId: undefined
        };
      }

      // Check each area
      for (const area of allAreas) {
        if (area.boundaries && this.isPointInPolygon(coordinates, area.boundaries.coordinates)) {
          // Customer is within this area
          let surcharge = area.base_travel_surcharge || 0;
          
          // If serviceId is provided, check if this area restricts available services
          if (serviceId && area.available_services && Array.isArray(area.available_services) && area.available_services.length > 0) {
            // Check if service is available in this area
            if (!area.available_services.includes(serviceId)) {
              // Service not available in this area - could apply higher surcharge or return error
              // For now, apply a default surcharge if service not available
              return {
                isWithinArea: false, // Mark as outside service area since service isn't available
                surcharge: area.base_travel_surcharge || 0,
                serviceAreaId: area.id
              };
            }
          }
          
          return {
            isWithinArea: true,
            surcharge: surcharge,
            serviceAreaId: area.id
          };
        }
      }

      // If no areas matched, customer is outside all service areas
      // Return the minimum surcharge of all areas as a default, or 0 if none defined
      const minSurcharge = allAreas.reduce((min, area) => 
        Math.min(min, area.base_travel_surcharge || 0), 
        Infinity
      );

      return {
        isWithinArea: false,
        surcharge: isFinite(minSurcharge) ? minSurcharge : 0,
        serviceAreaId: undefined
      };
    } catch (error) {
      console.error('Error checking service area coverage:', error);
      // On error, return safe defaults - assume within area with no surcharge
      return {
        isWithinArea: true,
        surcharge: 0,
        serviceAreaId: undefined
      };
    }
  }

  // Helper function to determine if a point is within a polygon
  private static isPointInPolygon(point: Coordinates, polygon: any): boolean {
    // Check if polygon is in the expected format
    if (!polygon || (!Array.isArray(polygon) && (!polygon.coordinates || !Array.isArray(polygon.coordinates)))) {
      return false;
    }

    // Handle different possible formats for polygon data
    let coordinatesArray: {lat: number, lng: number}[] = [];
    
    if (Array.isArray(polygon)) {
      // Direct array of coordinates
      coordinatesArray = polygon;
    } else if (polygon.coordinates && Array.isArray(polygon.coordinates)) {
      // Nested in coordinates property
      coordinatesArray = polygon.coordinates;
    } else {
      return false;
    }

    // Ray-casting algorithm to check if point is within polygon
    const x = point.lat, y = point.lng;
    let inside = false;

    for (let i = 0, j = coordinatesArray.length - 1; i < coordinatesArray.length; j = i++) {
      const xi = coordinatesArray[i].lat, yi = coordinatesArray[i].lng;
      const xj = coordinatesArray[j].lat, yj = coordinatesArray[j].lng;

      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }

    return inside;
  }

  // Helper function to validate if coordinates are within Indonesia boundaries
  private static isValidIndonesiaCoordinate(coords: Coordinates): boolean {
    // Indonesia boundaries
    const MIN_LAT = -11;   // Southernmost point of Indonesia
    const MAX_LAT = 6;     // Northernmost point of Indonesia
    const MIN_LNG = 95;    // Westernmost point of Indonesia
    const MAX_LNG = 141;   // Easternmost point of Indonesia

    return coords.lat >= MIN_LAT && 
           coords.lat <= MAX_LAT && 
           coords.lng >= MIN_LNG && 
           coords.lng <= MAX_LNG;
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
      console.log('[LocationService.resolveLocation] Already coordinates:', location);
      return location;
    }
    
    if (typeof location === 'string') {
      console.log('[LocationService.resolveLocation] Geocoding address:', location);
      const validation = await this.geocodeAddress(location);
      console.log('[LocationService.resolveLocation] Geocoding result:', validation);
      const coords = validation.address?.coordinates || null;
      if (!coords) {
        console.warn('[LocationService.resolveLocation] Failed to geocode address:', location, 'Result:', validation);
      }
      return coords;
    }
    
    console.warn('[LocationService.resolveLocation] Invalid location type:', typeof location, location);
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
    }>,
    tenantId?: string
  ): Promise<RouteOptimization> {
    const route = [];
    const unvisited = [...bookings.filter(b => b.coordinates)];
    let currentLocation = startLocation;
    let totalDistance = 0;
    let totalDuration = 0;
    let totalSurcharge = 0;
    let currentTime = new Date();

    // Get travel surcharge settings
    let travelSettings: TravelSurchargeSettings = {
      baseTravelSurcharge: 0,
      perKmSurcharge: 5000, // Default fallback
      travelSurchargeRequired: true
    };

    if (tenantId) {
      try {
        const invoiceSettings = await InvoiceSettingsService.getSettings(tenantId);
        if (invoiceSettings.travelSurcharge) {
          travelSettings = invoiceSettings.travelSurcharge;
        }
      } catch (error) {
        console.warn('[LocationService] Failed to get travel settings, using defaults:', error);
      }
    }

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
      
      // Calculate surcharge using settings: base + (distance × per km rate)
      const bookingSurcharge = this.calculateTravelSurcharge(nearestDistance, travelSettings);
      totalSurcharge += bookingSurcharge;

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