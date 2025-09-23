// Re-export types from API for consistency
export type { 
  Address, 
  OperatingHours, 
  Location, 
  Gym, 
  CreateGymData, 
  UpdateGymData,
  GymOwner
} from '../lib/gyms-api';

export interface GymLocation {
    locationId: string;
    name: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
        country: string;
    };
    capacity: number;
    amenities: string[];
    operatingHours: {
        [key: string]: {
            open: string;
            close: string;
            closed?: boolean;
        };
    };
    isActive: boolean;
}