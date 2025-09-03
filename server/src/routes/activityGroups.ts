import { Router } from 'express';
import { Types } from 'mongoose';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ActivityGroup } from '../models/ActivityGroup';
import ActivityTemplate from '../models/ActivityTemplate';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// GET /api/activity-groups - List activity groups
router.get('/', async (req: AuthRequest, res): Promise<void> => {
  try {
    const user = req.user!;
    let activityGroups;

    if (user.userType === 'admin') {
      // Admin sees all groups (or only global if gymId not specified)
      const gymId = req.query.gymId as string;
      activityGroups = await ActivityGroup.findByGym(gymId);
    } else {
      // Non-admin users see their gym groups + global groups
      activityGroups = await ActivityGroup.findByGym(user.gymId);
    }

    // Get activity counts for each group
    const groupsWithCounts = await Promise.all(
      activityGroups.map(async (group) => {
        const count = await ActivityTemplate.countDocuments({
          activityGroupId: group._id,
          isActive: true
        });
        
        return {
          _id: group._id,
          name: group.name,
          description: group.description,
          gymId: group.gymId,
          count,
          isActive: group.isActive,
          createdAt: group.createdAt,
          updatedAt: group.updatedAt
        };
      })
    );

    res.json({
      success: true,
      data: {
        activityGroups: groupsWithCounts
      }
    });
  } catch (error) {
    console.error('Error fetching activity groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity groups'
    });
  }
});

// GET /api/activity-groups/:id - Get single activity group
router.get('/:id', async (req: AuthRequest, res): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const activityGroup = await ActivityGroup.findById(id);
    if (!activityGroup) {
      res.status(404).json({
        success: false,
        message: 'Activity group not found'
      });
      return;
    }

    // Check if user can access this activity group
    const canAccess = user.userType === 'admin' || 
                     (user.gymId && user.gymId === activityGroup.gymId?.toString());

    if (!canAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this activity group'
      });
      return;
    }

    // Get activity count
    const count = await ActivityTemplate.countDocuments({
      activityGroupId: activityGroup._id,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        activityGroup: {
          ...activityGroup.toJSON(),
          count
        }
      }
    });
  } catch (error) {
    console.error('Error fetching activity group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity group'
    });
  }
});

// POST /api/activity-groups - Create new activity group
router.post('/', async (req: AuthRequest, res): Promise<void> => {
  try {
    const user = req.user!;
    const { name, gymId, description } = req.body;

    // Always assign to a gym - no global groups
    let finalGymId: Types.ObjectId;
    if (user.userType === 'admin') {
      // Admin can create groups for any gym
      if (gymId) {
        finalGymId = new Types.ObjectId(gymId);
      } else {
        res.status(400).json({
          success: false,
          message: 'Gym ID is required'
        });
        return;
      }
    } else {
      // Non-admin users create groups for their gym
      if (!user.gymId) {
        res.status(400).json({
          success: false,
          message: 'User must be assigned to a gym'
        });
        return;
      }
      finalGymId = new Types.ObjectId(user.gymId);
    }

    // Check if group with this name already exists in this gym
    const existingGroup = await ActivityGroup.findByName(name, finalGymId.toString());
    if (existingGroup) {
      res.status(400).json({
        success: false,
        message: `Activity group "${name}" already exists in this gym`
      });
      return;
    }

    // Create the activity group
    const activityGroup = new ActivityGroup({
      name: name.trim(),
      gymId: finalGymId,
      description: description?.trim(),
      isActive: true
    });

    await activityGroup.save();

    res.status(201).json({
      success: true,
      data: {
        activityGroup: {
          ...activityGroup.toJSON(),
          count: 0
        }
      },
      message: 'Activity group created successfully'
    });
  } catch (error) {
    console.error('Error creating activity group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity group'
    });
  }
});

// PUT /api/activity-groups/:id - Update activity group
router.put('/:id', async (req: AuthRequest, res): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { name, description } = req.body;

    const activityGroup = await ActivityGroup.findById(id);
    if (!activityGroup) {
      res.status(404).json({
        success: false,
        message: 'Activity group not found'
      });
      return;
    }

    // Check if user can edit this activity group
    const canEdit = user.userType === 'admin' || 
                   (user.gymId && user.gymId === activityGroup.gymId?.toString());
    
    // Additional restriction: only admin, gym_owner, and coach can edit (clients cannot)
    const hasEditRole = user.userType === 'admin' || user.userType === 'gym_owner' || user.userType === 'coach';
    const finalCanEdit = canEdit && hasEditRole;

    if (!finalCanEdit) {
      res.status(403).json({
        success: false,
        message: 'Access denied to edit this activity group'
      });
      return;
    }

    // Check for name conflicts if name is being changed
    if (name && name !== activityGroup.name) {
      const existingGroup = await ActivityGroup.findByName(name, activityGroup.gymId?.toString());
      if (existingGroup && existingGroup._id.toString() !== id) {
        res.status(400).json({
          success: false,
          message: `Activity group "${name}" already exists in this scope`
        });
      }
      activityGroup.name = name.trim();
    }

    if (description !== undefined) {
      activityGroup.description = description?.trim() || undefined;
    }

    await activityGroup.save();

    // Get activity count
    const count = await ActivityTemplate.countDocuments({
      activityGroupId: activityGroup._id,
      isActive: true
    });

    res.json({
      success: true,
      data: {
        activityGroup: {
          ...activityGroup.toJSON(),
          count
        }
      },
      message: 'Activity group updated successfully'
    });
  } catch (error) {
    console.error('Error updating activity group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity group'
    });
  }
});

// DELETE /api/activity-groups/:id - Delete activity group (soft delete)
router.delete('/:id', async (req: AuthRequest, res): Promise<void> => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const activityGroup = await ActivityGroup.findById(id);
    if (!activityGroup) {
      res.status(404).json({
        success: false,
        message: 'Activity group not found'
      });
      return;
    }

    // Check if user can delete this activity group
    const canDelete = user.userType === 'admin' || 
                     (user.gymId && user.gymId === activityGroup.gymId?.toString());
    
    // Additional restriction: only admin, gym_owner, and coach can delete (clients cannot)
    const hasDeleteRole = user.userType === 'admin' || user.userType === 'gym_owner' || user.userType === 'coach';
    const finalCanDelete = canDelete && hasDeleteRole;

    if (!finalCanDelete) {
      res.status(403).json({
        success: false,
        message: 'Access denied to delete this activity group'
      });
      return;
    }

    // Check if any activities are using this group
    const activitiesCount = await ActivityTemplate.countDocuments({
      activityGroupId: activityGroup._id,
      isActive: true
    });

    if (activitiesCount > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete activity group "${activityGroup.name}" because it has ${activitiesCount} active activities`
      });
      return;
    }

    // Soft delete
    activityGroup.isActive = false;
    await activityGroup.save();

    res.json({
      success: true,
      message: 'Activity group deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting activity group:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity group'
    });
  }
});

export { router as activityGroupsRouter };