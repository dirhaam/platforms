// Location and address management types

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  fullAddress: string;
  coordinates?: Coordinates;
}

export interface ServiceArea {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  isActive: boolean;
  // Geographic boundaries
  boundaries: ServiceAreaBoundary;
  // Pricing and logistics
  baseTravelSurcharge: number;
  perKmSurcharge?: number;
  maxTravelDistance: number; // in kilometers
  estimatedTravelTime: number; // base travel time in minutes
  // Service availability
  availableServices: string[]; // service IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceAreaBoundary {
  type: 'circle' | 'polygon';
  // For circle type
  center?: Coordinates;
  radius?: number; // in kilometers
  // For polygon type
  coordinates?: Coordinates[];
}

export interface AddressValidation {
  isValid: boolean;
  address?: Address;
  suggestions?: Address[];
  error?: string;
  confidence?: number; // 0-1 score
}

export interface TravelCalculation {
  distance: number; // in kilometers
  duration: number; // in minutes
  route?: Coordinates[];
  surcharge: number;
  isWithinServiceArea: boolean;
  serviceAreaId?: string;
}

export interface RouteOptimization {
  optimizedRoute: RouteStop[];
  totalDistance: number;
  totalDuration: number;
  totalSurcharge: number;
}

export interface RouteStop {
  bookingId: string;
  address: string;
  coordinates: Coordinates;
  estimatedArrival: Date;
  serviceTime: number; // minutes
  travelTimeFromPrevious: number; // minutes
  distanceFromPrevious: number; // kilometers
}

// Request/Response types
export interface CreateServiceAreaRequest {
  name: string;
  description?: string;
  boundaries: ServiceAreaBoundary;
  baseTravelSurcharge: number;
  perKmSurcharge?: number;
  maxTravelDistance: number;
  estimatedTravelTime: number;
  availableServices: string[];
}

export interface UpdateServiceAreaRequest {
  name?: string;
  description?: string;
  boundaries?: ServiceAreaBoundary;
  baseTravelSurcharge?: number;
  perKmSurcharge?: number;
  maxTravelDistance?: number;
  estimatedTravelTime?: number;
  availableServices?: string[];
  isActive?: boolean;
}

export interface ValidateAddressRequest {
  address: string;
  tenantId: string;
}

export interface CalculateTravelRequest {
  origin: Coordinates | string; // coordinates or address
  destination: Coordinates | string;
  tenantId: string;
  serviceId?: string;
}

export interface OptimizeRouteRequest {
  startLocation: Coordinates | string;
  bookings: {
    id: string;
    address: string;
    coordinates?: Coordinates;
    serviceTime: number;
    scheduledAt: Date;
  }[];
  tenantId: string;
}

// Travel Surcharge Settings
export interface TravelSurchargeSettings {
  baseTravelSurcharge: number; // Base surcharge amount (fixed Rp)
  perKmSurcharge: number; // Per-kilometer surcharge (Rp per km)
  minTravelDistance?: number; // Min distance before surcharge applies (km)
  maxTravelDistance?: number; // Max distance allowed (km)
  travelSurchargeRequired: boolean; // Auto-apply to all home visits
}

// Configuration types
export interface LocationServiceConfig {
  geocodingProvider: 'google' | 'mapbox' | 'nominatim';
  routingProvider: 'google' | 'mapbox' | 'osrm';
  apiKeys: {
    google?: string;
    mapbox?: string;
  };
  defaultCountry: string;
  defaultLanguage: string;
  cacheEnabled: boolean;
  cacheTtl: number; // seconds
}

// Error types
export enum LocationErrorType {
  GEOCODING_FAILED = 'GEOCODING_FAILED',
  ROUTING_FAILED = 'ROUTING_FAILED',
  ADDRESS_NOT_FOUND = 'ADDRESS_NOT_FOUND',
  OUTSIDE_SERVICE_AREA = 'OUTSIDE_SERVICE_AREA',
  INVALID_COORDINATES = 'INVALID_COORDINATES',
  API_LIMIT_EXCEEDED = 'API_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE'
}

export interface LocationError {
  type: LocationErrorType;
  message: string;
  details?: any;
}