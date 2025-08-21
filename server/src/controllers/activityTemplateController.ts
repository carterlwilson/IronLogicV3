import { Response } from 'express';
import { Types } from 'mongoose';
import ActivityTemplate, { IActivityTemplate } from '../models/ActivityTemplate';
import { ActivityGroup } from '../models/ActivityGroup';
import { AuthRequest } from '../middleware/auth';

// Helper function to build query filters
const buildQueryFilters = (query: any, userGymId?: Types.ObjectId) => {
  const filters: any = { isActive: true };
  
  // Gym filtering: show global activities plus gym-specific activities
  if (userGymId) {
    filters.$or = [
      { gymId: userGymId },
      { gymId: null }
    ];
  } else if (query.gymId && query.gymId !== 'global') {
    // Admin can filter by specific gym or global
    filters.$or = [
      { gymId: new Types.ObjectId(query.gymId) },
      { gymId: null }
    ];
  } else if (query.gymId === 'global') {
    filters.gymId = null;
  }
  
  // Type filtering
  if (query.type) {
    filters.type = query.type;
  }
  
  // Activity group filtering
  if (query.activityGroupId) {
    filters.activityGroupId = new Types.ObjectId(query.activityGroupId);
  }
  
  
  // Text search
  if (query.search) {
    filters.$text = { $search: query.search };
  }
  
  return filters;
};

// GET /api/activities - List activities with filtering, pagination, and sorting
export const getActivities = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      sort = 'name',
      ...filterParams 
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // Determine user's gym access
    const userGymId = req.user?.userType === 'admin' ? undefined : req.user?.gymId;
    
    // Build filters
    const filters = buildQueryFilters(filterParams, userGymId as Types.ObjectId | undefined);
    
    // Build sort object
    let sortObj: any = {};
    if (typeof sort === 'string') {
      if (sort.startsWith('-')) {
        sortObj[sort.substring(1)] = -1;
      } else {
        sortObj[sort] = 1;
      }
    }
    
    // Add text search score sorting if applicable
    if (filters.$text) {
      sortObj.score = { $meta: 'textScore' };
    }
    
    // Execute queries
    const [activities, total] = await Promise.all([
      ActivityTemplate.find(filters)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('gymId', 'name')
        .populate('activityGroupId', 'name description')
        .lean(),
      ActivityTemplate.countDocuments(filters)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    // Transform activities to include populated activityGroup
    const transformedActivities = activities.map((activity: any) => ({
      ...activity,
      activityGroup: activity.activityGroupId // Rename populated field
    }));

    res.status(200).json({
      success: true,
      data: {
        activities: transformedActivities,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    });
  } catch (error: any) {
    console.error('Error fetching activities:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activities',
      error: error.message
    });
  }
};

// GET /api/activities/:id - Get single activity
export const getActivityById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid activity ID'
      });
      return;
    }
    
    const activity = await ActivityTemplate.findOne({
      _id: new Types.ObjectId(id),
      isActive: true
    }).populate([
      { path: 'gymId', select: 'name' },
      { path: 'activityGroupId', select: 'name description' }
    ]);
    
    if (!activity) {
      res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
      return;
    }
    
    // Check gym access for non-admin users
    if (req.user?.userType !== 'admin') {
      const userGymId = req.user?.gymId?.toString();
      const activityGymId = activity.gymId?.toString();
      
      if (activityGymId && activityGymId !== userGymId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this activity'
        });
        return;
      }
    }
    
    // Transform activity to include populated activityGroup
    const transformedActivity = {
      ...activity.toJSON(),
      activityGroup: activity.activityGroupId
    };

    res.status(200).json({
      success: true,
      data: { activity: transformedActivity }
    });
  } catch (error: any) {
    console.error('Error fetching activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity',
      error: error.message
    });
  }
};

// POST /api/activities - Create new activity
export const createActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      gymId,
      activityGroupId,
      type,
      description,
      instructions
    } = req.body;
    
    // Validate required fields
    if (!name || !activityGroupId || !type) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: name, activityGroupId, type'
      });
      return;
    }

    // Verify activity group exists and user has access to it
    const activityGroup = await ActivityGroup.findById(activityGroupId);
    if (!activityGroup) {
      res.status(400).json({
        success: false,
        message: 'Activity group not found'
      });
      return;
    }

    // Check if user can use this activity group
    const canUseGroup = req.user!.userType === 'admin' || 
                       req.user!.userType === 'gym_owner' ||
                       req.user!.userType === 'coach' ||
                       !activityGroup.gymId || 
                       (req.user!.gymId && req.user!.gymId === activityGroup.gymId.toString());
    
    if (!canUseGroup) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this activity group'
      });
      return;
    }
    
    // Determine gym assignment
    let assignedGymId: Types.ObjectId | null = null;
    
    if (req.user?.userType === 'admin') {
      // Admin can create global activities (gymId = null) or gym-specific activities
      if (gymId && gymId !== 'global') {
        if (!Types.ObjectId.isValid(gymId)) {
          res.status(400).json({
            success: false,
            message: 'Invalid gym ID'
          });
          return;
        }
        assignedGymId = new Types.ObjectId(gymId);
      }
    } else {
      // Non-admin users can only create activities for their gym
      assignedGymId = req.user?.gymId ? new Types.ObjectId(req.user.gymId) : null;
    }
    
    // Check for duplicate names within the same scope (gym or global)
    const existingActivity = await ActivityTemplate.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') },
      gymId: assignedGymId,
      isActive: true
    });
    
    if (existingActivity) {
      res.status(409).json({
        success: false,
        message: 'Activity with this name already exists in this scope'
      });
      return;
    }
    
    // Create activity
    const activityData: Partial<IActivityTemplate> = {
      name: name.trim(),
      gymId: assignedGymId as any,
      activityGroupId: new Types.ObjectId(activityGroupId),
      type,
      description: description?.trim(),
      instructions: instructions?.trim()
    };
    
    const activity = new ActivityTemplate(activityData);
    await activity.save();
    
    await activity.populate([
      { path: 'gymId', select: 'name' },
      { path: 'activityGroupId', select: 'name description' }
    ]);
    
    // Transform activity to include populated activityGroup
    const transformedActivity = {
      ...activity.toJSON(),
      activityGroup: activity.activityGroupId
    };

    res.status(201).json({
      success: true,
      data: { activity: transformedActivity },
      message: 'Activity created successfully'
    });
  } catch (error: any) {
    console.error('Error creating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create activity',
      error: error.message
    });
  }
};

// PUT /api/activities/:id - Update activity
export const updateActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      activityGroupId,
      type,
      description,
      instructions
    } = req.body;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid activity ID'
      });
      return;
    }
    
    const activity = await ActivityTemplate.findOne({
      _id: new Types.ObjectId(id),
      isActive: true
    });
    
    if (!activity) {
      res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
      return;
    }
    
    // Check permissions
    if (req.user?.userType === 'client') {
      res.status(403).json({
        success: false,
        message: 'Clients cannot edit activities'
      });
      return;
    }
    
    if (req.user?.userType !== 'admin') {
      const userGymId = req.user?.gymId?.toString();
      const activityGymId = activity.gymId?.toString();
      
      // Allow editing if activity belongs to user's gym OR is global (null gymId)
      if (activityGymId && activityGymId !== userGymId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to update this activity'
        });
        return;
      }
    }
    
    // Check for name conflicts if name is being changed
    if (name && name !== activity.name) {
      const existingActivity = await ActivityTemplate.findOne({
        name: { $regex: new RegExp('^' + name + '$', 'i') },
        gymId: activity.gymId,
        _id: { $ne: new Types.ObjectId(id) },
        isActive: true
      });
      
      if (existingActivity) {
        res.status(409).json({
          success: false,
          message: 'Activity with this name already exists in this scope'
        });
        return;
      }
    }
    
    // Update fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (activityGroupId !== undefined) {
      // Verify activity group exists and user has access to it
      const activityGroup = await ActivityGroup.findById(activityGroupId);
      if (!activityGroup) {
        res.status(400).json({
          success: false,
          message: 'Activity group not found'
        });
        return;
      }

      // Check if user can use this activity group
      const canUseGroup = req.user!.userType === 'admin' || 
                         req.user!.userType === 'gym_owner' ||
                         req.user!.userType === 'coach' ||
                         !activityGroup.gymId || 
                         (req.user!.gymId && req.user!.gymId === activityGroup.gymId.toString());
      
      if (!canUseGroup) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this activity group'
        });
        return;
      }

      updateData.activityGroupId = new Types.ObjectId(activityGroupId);
    }
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description?.trim();
    if (instructions !== undefined) updateData.instructions = instructions?.trim();
    
    const updatedActivity = await ActivityTemplate.findByIdAndUpdate(
      new Types.ObjectId(id),
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'gymId', select: 'name' },
      { path: 'activityGroupId', select: 'name description' }
    ]);
    
    // Transform activity to include populated activityGroup
    const transformedActivity = {
      ...updatedActivity!.toJSON(),
      activityGroup: updatedActivity!.activityGroupId
    };
    
    res.status(200).json({
      success: true,
      data: { activity: transformedActivity },
      message: 'Activity updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update activity',
      error: error.message
    });
  }
};

// DELETE /api/activities/:id - Soft delete activity
export const deleteActivity = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid activity ID'
      });
      return;
    }
    
    const activity = await ActivityTemplate.findOne({
      _id: new Types.ObjectId(id),
      isActive: true
    });
    
    if (!activity) {
      res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
      return;
    }
    
    // Check permissions
    if (req.user?.userType === 'client') {
      res.status(403).json({
        success: false,
        message: 'Clients cannot delete activities'
      });
      return;
    }
    
    if (req.user?.userType !== 'admin') {
      const userGymId = req.user?.gymId?.toString();
      const activityGymId = activity.gymId?.toString();
      
      // Allow deleting if activity belongs to user's gym OR is global (null gymId)
      if (activityGymId && activityGymId !== userGymId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to delete this activity'
        });
        return;
      }
    }
    
    // Soft delete by setting isActive to false
    await ActivityTemplate.findByIdAndUpdate(new Types.ObjectId(id), { isActive: false });
    
    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete activity',
      error: error.message
    });
  }
};

// GET /api/activities/groups - Get distinct activity groups
export const getActivityGroups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { gymId } = req.query;
    
    // Determine gym access
    let queryGymId = undefined;
    
    if (req.user?.userType === 'admin') {
      if (gymId && gymId !== 'all') {
        if (gymId === 'global') {
          // Only global activities
          queryGymId = null;
        } else if (Types.ObjectId.isValid(gymId as string)) {
          queryGymId = new Types.ObjectId(gymId as string);
        }
      }
      // If gymId is 'all' or undefined, queryGymId remains undefined (all activities)
    } else {
      // Non-admin users see their gym + global activities
      queryGymId = req.user?.gymId;
    }
    
    const groups = await (ActivityTemplate as any).getActivityGroups(queryGymId);
    
    res.status(200).json({
      success: true,
      data: { groups }
    });
  } catch (error: any) {
    console.error('Error fetching activity groups:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch activity groups',
      error: error.message
    });
  }
};