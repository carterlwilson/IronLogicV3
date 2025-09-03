export interface ActivityTemplate {
  _id: string;
  gymId: string | null;
  name: string;
  type: 'strength' | 'conditioning' | 'diagnostic';
  description?: string;
  instructions?: string;
  notes?: string;
  activityGroup: string;
  activityGroupName: string; // Pre-populated activity group name
  benchmarkTemplateId?: string | null;
  benchmarkTemplateName?: string | null; // Pre-populated benchmark template name
  tags: string[];
  equipment: string[];
  muscleGroups: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityGroup {
  _id: string;
  name: string;
  gymId?: string | null; // null for global activity groups
  description?: string;
  count: number; // Number of activities using this group
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}