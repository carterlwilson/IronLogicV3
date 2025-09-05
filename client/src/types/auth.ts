export type UserType = 'admin' | 'gym_owner' | 'coach' | 'client';

export interface User {
  _id: string;
  email: string;
  name: string;
  userType: UserType;
  gymId?: {
    _id: string;
    name: string;
    location: string;
  } | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastLogin?: string;
}