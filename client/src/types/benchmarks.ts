export interface BenchmarkTemplate {
  _id: string;
  gymId: string | null;
  name: string;
  type: 'weight' | 'time' | 'reps';
  unit: string;
  description?: string;
  instructions?: string;
  notes?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}