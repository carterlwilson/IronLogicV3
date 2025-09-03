export type UserType = 'admin' | 'gym_owner' | 'coach' | 'client';

export interface User {
  _id: string;
  email: string;
  name: string;
  userType: UserType;
  gymId: string | null;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  lastLogin?: string;
}