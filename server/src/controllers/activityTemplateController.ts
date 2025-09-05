import { Response } from 'express';
import { Types } from 'mongoose';
import ActivityTemplate, { IActivityTemplate } from '../models/ActivityTemplate';
import { ActivityGroup } from '../models/ActivityGroup';
import BenchmarkTemplate from '../models/BenchmarkTemplate';
import { AuthRequest } from '../middleware/auth';

// Helper function to build query filters
const buildQueryFilters = (query: any, userGymId?: Types.ObjectId) => {
  const filters: any = { isActive: true };
  
  // Gym filtering: admins can see all gyms' activities, others see only their gym
  if (userGymId) {
    filters.gymId = userGymId;
  } else if (query.gymId) {
    // Admin can filter by specific gym
    filters.gymId = new Types.ObjectId(query.gymId);
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
        .lean(),
      ActivityTemplate.countDocuments(filters)
    ]);
    
    // Get unique activity group IDs for bulk lookup
    const activityGroupIds = activities
      .map((activity: any) => activity.activityGroupId)
      .filter(id => id); // Filter out any null/undefined values
    
    // Get unique benchmark template IDs for bulk lookup
    const benchmarkTemplateIds = activities
      .filter((activity: any) => activity.benchmarkTemplateId)
      .map((activity: any) => activity.benchmarkTemplateId);
    
    // Bulk fetch activity groups and benchmark templates
    const [activityGroups, benchmarkTemplates] = await Promise.all([
      activityGroupIds.length > 0 
        ? ActivityGroup.find({ _id: { $in: activityGroupIds }, isActive: true })
            .select('name')
            .lean()
        : [],
      benchmarkTemplateIds.length > 0 
        ? BenchmarkTemplate.find({ _id: { $in: benchmarkTemplateIds }, isActive: true })
            .select('name type unit')
            .lean()
        : []
    ]);
    
    // Create maps for quick lookup
    const activityGroupMap = new Map();
    activityGroups.forEach((group: any) => {
      activityGroupMap.set(group._id.toString(), group.name);
    });
    
    const benchmarkTemplateMap = new Map();
    benchmarkTemplates.forEach((template: any) => {
      benchmarkTemplateMap.set(template._id.toString(), template.name);
    });
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    // Transform activities to include activity group and benchmark template names
    const transformedActivities = activities.map((activity: any) => ({
      ...activity,
      activityGroup: activity.activityGroupId?.toString() || null, // Keep ID for backward compatibility
      activityGroupName: activity.activityGroupId 
        ? activityGroupMap.get(activity.activityGroupId.toString()) || 'No Group'
        : 'No Group',
      benchmarkTemplateName: activity.benchmarkTemplateId 
        ? benchmarkTemplateMap.get(activity.benchmarkTemplateId.toString()) || null
        : null
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
    }).populate('gymId', 'name').lean();
    
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
    
    // Fetch activity group and benchmark template names
    const [activityGroupData, benchmarkTemplateData] = await Promise.all([
      activity.activityGroupId 
        ? ActivityGroup.findOne({ _id: activity.activityGroupId, isActive: true }).select('name').lean()
        : null,
      activity.benchmarkTemplateId
        ? BenchmarkTemplate.findOne({ _id: activity.benchmarkTemplateId, isActive: true }).select('name').lean()
        : null
    ]);
    
    // Transform activity to include activity group and benchmark template names
    const transformedActivity = {
      ...activity,
      activityGroup: activity.activityGroupId?.toString() || null, // Keep ID for backward compatibility
      activityGroupName: activityGroupData?.name || 'No Group',
      benchmarkTemplateName: benchmarkTemplateData?.name || null
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
      benchmarkTemplateId,
      type,
      description,
      notes
    } = req.body;
    
    // Validate required fields
    if (!name || !type) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: name, type'
      });
      return;
    }

    // Verify activity group exists and user has access to it (if provided)
    let activityGroup = null;
    if (activityGroupId) {
      activityGroup = await ActivityGroup.findById(activityGroupId);
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
    }

    // Validate benchmark template if provided
    let benchmarkTemplateObjectId: Types.ObjectId | null = null;
    if (benchmarkTemplateId) {
      if (!Types.ObjectId.isValid(benchmarkTemplateId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid benchmark template ID'
        });
        return;
      }

      // Import BenchmarkTemplate here to avoid circular dependencies
      const BenchmarkTemplate = require('../models/BenchmarkTemplate').default;
      const benchmarkTemplate = await BenchmarkTemplate.findById(benchmarkTemplateId);
      
      if (!benchmarkTemplate || !benchmarkTemplate.isActive) {
        res.status(400).json({
          success: false,
          message: 'Benchmark template not found'
        });
        return;
      }

      // Check if user has access to this benchmark template
      const canUseBenchmark = req.user!.userType === 'admin' || 
                             !benchmarkTemplate.gymId || 
                             (req.user!.gymId && req.user!.gymId === benchmarkTemplate.gymId.toString());
      
      if (!canUseBenchmark) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this benchmark template'
        });
        return;
      }

      benchmarkTemplateObjectId = new Types.ObjectId(benchmarkTemplateId);
    }
    
    // Always assign gymId - no global activities
    let assignedGymId: Types.ObjectId;
    
    if (req.user?.userType === 'admin') {
      // Admin can create activities for any gym
      if (gymId) {
        if (!Types.ObjectId.isValid(gymId)) {
          res.status(400).json({
            success: false,
            message: 'Invalid gym ID'
          });
          return;
        }
        assignedGymId = new Types.ObjectId(gymId);
      } else {
        res.status(400).json({
          success: false,
          message: 'Gym ID is required'
        });
        return;
      }
    } else {
      // Non-admin users create activities for their gym
      if (!req.user?.gymId) {
        res.status(400).json({
          success: false,
          message: 'User must be assigned to a gym'
        });
        return;
      }
      assignedGymId = new Types.ObjectId(req.user.gymId);
    }
    
    // Check for duplicate names within the gym
    const existingActivity = await ActivityTemplate.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') },
      gymId: assignedGymId,
      isActive: true
    });
    
    if (existingActivity) {
      res.status(409).json({
        success: false,
        message: 'Activity with this name already exists in this gym'
      });
      return;
    }
    
    // Create activity
    const activityData: Partial<IActivityTemplate> = {
      name: name.trim(),
      gymId: assignedGymId,
      benchmarkTemplateId: benchmarkTemplateObjectId as any,
      type,
      description: description?.trim(),
      notes: notes?.trim()
    };
    
    // Only add activityGroupId if it's provided
    if (activityGroupId) {
      activityData.activityGroupId = new Types.ObjectId(activityGroupId);
    }
    
    const activity = new ActivityTemplate(activityData);
    await activity.save();
    
    await activity.populate('gymId', 'name');
    
    // Fetch activity group and benchmark template names
    const [activityGroupData, benchmarkTemplateData] = await Promise.all([
      activity.activityGroupId 
        ? ActivityGroup.findOne({ _id: activity.activityGroupId, isActive: true }).select('name').lean()
        : null,
      activity.benchmarkTemplateId
        ? BenchmarkTemplate.findOne({ _id: activity.benchmarkTemplateId, isActive: true }).select('name').lean()
        : null
    ]);
    
    // Transform activity to include activity group and benchmark template names
    const activityJson = activity.toJSON();
    const transformedActivity = {
      ...activityJson,
      activityGroup: activity.activityGroupId?.toString() || null, // Keep ID for backward compatibility
      activityGroupName: activityGroupData?.name || 'No Group',
      benchmarkTemplateName: benchmarkTemplateData?.name || null
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
      benchmarkTemplateId,
      type,
      description,
      notes
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
      
      // Allow editing only if activity belongs to user's gym
      if (!activityGymId || activityGymId !== userGymId) {
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
      if (activityGroupId === null || activityGroupId === '') {
        // Remove activity group association
        updateData.activityGroupId = null;
      } else {
        // Validate activityGroupId is a valid ObjectId string
        if (!Types.ObjectId.isValid(activityGroupId)) {
          res.status(400).json({
            success: false,
            message: 'Invalid activity group ID'
          });
          return;
        }
        
        // Verify activity group exists and user has access to it
        const activityGroup = await ActivityGroup.findById(new Types.ObjectId(activityGroupId));
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
    }

    // Handle benchmark template update
    if (benchmarkTemplateId !== undefined) {
      if (benchmarkTemplateId === null || benchmarkTemplateId === '') {
        // Remove benchmark template association
        updateData.benchmarkTemplateId = null;
      } else {
        // Validate and set new benchmark template
        if (!Types.ObjectId.isValid(benchmarkTemplateId)) {
          res.status(400).json({
            success: false,
            message: 'Invalid benchmark template ID'
          });
          return;
        }

        const BenchmarkTemplate = require('../models/BenchmarkTemplate').default;
        const benchmarkTemplate = await BenchmarkTemplate.findById(benchmarkTemplateId);
        
        if (!benchmarkTemplate || !benchmarkTemplate.isActive) {
          res.status(400).json({
            success: false,
            message: 'Benchmark template not found'
          });
          return;
        }

        // Check if user has access to this benchmark template
        const canUseBenchmark = req.user!.userType === 'admin' || 
                               !benchmarkTemplate.gymId || 
                               (req.user!.gymId && req.user!.gymId === benchmarkTemplate.gymId.toString());
        
        if (!canUseBenchmark) {
          res.status(403).json({
            success: false,
            message: 'Access denied to this benchmark template'
          });
          return;
        }

        updateData.benchmarkTemplateId = new Types.ObjectId(benchmarkTemplateId);
      }
    }

    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description?.trim();
    if (notes !== undefined) updateData.notes = notes?.trim();
    
    const updatedActivity = await ActivityTemplate.findByIdAndUpdate(
      new Types.ObjectId(id),
      updateData,
      { new: true, runValidators: true }
    ).populate('gymId', 'name');
    
    // Fetch activity group and benchmark template names
    const [activityGroupData, benchmarkTemplateData] = await Promise.all([
      updatedActivity!.activityGroupId 
        ? ActivityGroup.findOne({ _id: updatedActivity!.activityGroupId, isActive: true }).select('name').lean()
        : null,
      updatedActivity!.benchmarkTemplateId
        ? BenchmarkTemplate.findOne({ _id: updatedActivity!.benchmarkTemplateId, isActive: true }).select('name').lean()
        : null
    ]);
    
    // Transform activity to include activity group and benchmark template names
    const activityJson = updatedActivity!.toJSON();
    const transformedActivity = {
      ...activityJson,
      activityGroup: updatedActivity!.activityGroupId?.toString() || null, // Keep ID for backward compatibility
      activityGroupName: activityGroupData?.name || 'No Group',
      benchmarkTemplateName: benchmarkTemplateData?.name || null
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

// DELETE /api/activities/:id - Hard delete activity
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
      
      // Allow deleting only if activity belongs to user's gym
      if (!activityGymId || activityGymId !== userGymId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to delete this activity'
        });
        return;
      }
    }
    
    // TODO: When workout programs are implemented, add dependency checking here
    // to prevent deletion of activities that are referenced in active programs
    
    // Hard delete the activity template
    await ActivityTemplate.findByIdAndDelete(new Types.ObjectId(id));
    
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