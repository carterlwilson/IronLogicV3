import { Response } from 'express';
import { Types } from 'mongoose';
import ScheduleTemplate, { IScheduleTemplate } from '../models/ScheduleTemplate';
import { Gym } from '../models/Gym';
import { User } from '../models/User';
import WorkoutProgram from '../models/WorkoutProgram';
import { AuthRequest } from '../middleware/auth';

// Helper function to validate user access to gym
const validateGymAccess = async (req: AuthRequest, gymId: Types.ObjectId) => {
  if (req.user?.userType === 'admin') {
    return true; // Admin can access all gyms
  }
  
  if (req.user?.gymId && req.user.gymId.toString() === gymId.toString()) {
    return true; // User belongs to this gym
  }
  
  return false;
};

// Helper function to validate coach belongs to gym
const validateCoachAccess = async (coachId: Types.ObjectId, gymId: Types.ObjectId) => {
  const coach = await User.findOne({
    _id: coachId,
    gymId: gymId,
    userType: { $in: ['coach', 'gym_owner'] },
    isActive: true
  });
  return !!coach;
};

// Helper function to validate program belongs to gym
const validateProgramAccess = async (programId: Types.ObjectId, gymId: Types.ObjectId) => {
  const program = await WorkoutProgram.findOne({
    _id: programId,
    gymId: gymId,
    isActive: true
  });
  return !!program;
};

// GET /api/schedule-templates - List templates for gym with filtering and pagination
export const getScheduleTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search,
      includeStats = false 
    } = req.query;
    
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;
    
    // Determine gym access
    let gymId: Types.ObjectId;
    
    if (req.user?.userType === 'admin') {
      if (!req.query.gymId) {
        res.status(400).json({
          success: false,
          message: 'Gym ID is required for admin users'
        });
        return;
      }
      if (!Types.ObjectId.isValid(req.query.gymId as string)) {
        res.status(400).json({
          success: false,
          message: 'Invalid gym ID'
        });
        return;
      }
      gymId = new Types.ObjectId(req.query.gymId as string);
    } else {
      if (!req.user?.gymId) {
        res.status(400).json({
          success: false,
          message: 'User must be assigned to a gym'
        });
        return;
      }
      gymId = new Types.ObjectId(req.user.gymId);
    }
    
    // Build filter
    const filter: any = { gymId, isActive: true };
    
    if (search) {
      filter.$text = { $search: search as string };
    }
    
    let templates;
    
    if (includeStats === 'true') {
      // Use aggregation pipeline for statistics
      const pipeline: any[] = [
        { $match: filter },
        {
          $addFields: {
            totalTimeslots: { $size: '$timeslots' },
            activeTimeslots: {
              $size: {
                $filter: {
                  input: '$timeslots',
                  cond: { $eq: ['$$this.isActive', true] }
                }
              }
            },
            uniqueCoaches: {
              $size: {
                $setUnion: ['$timeslots.coachId', []]
              }
            }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdByUser',
            pipeline: [{ $project: { name: 1, email: 1 } }]
          }
        },
        {
          $unwind: {
            path: '$createdByUser',
            preserveNullAndEmptyArrays: true
          }
        },
        { $sort: { isDefault: -1, updatedAt: -1 } },
        { $skip: skip },
        { $limit: limitNum }
      ];
      
      templates = await ScheduleTemplate.aggregate(pipeline);
    } else {
      // Simple query without stats
      templates = await ScheduleTemplate.find(filter)
        .populate('createdBy', 'name email')
        .sort({ isDefault: -1, updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean();
    }
    
    // Get total count for pagination
    const total = await ScheduleTemplate.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    res.status(200).json({
      success: true,
      data: {
        templates,
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
    console.error('Error fetching schedule templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedule templates',
      error: error.message
    });
  }
};

// GET /api/schedule-templates/:id - Get single template with populated data
export const getScheduleTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid schedule template ID'
      });
      return;
    }
    
    const template = await ScheduleTemplate.findOne({
      _id: new Types.ObjectId(id),
      isActive: true
    })
    .populate('createdBy', 'name email')
    .populate('timeslots.coachId', 'name email')
    .populate('timeslots.programId', 'name description')
    .lean();
    
    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Schedule template not found'
      });
      return;
    }
    
    // Check gym access
    const hasAccess = await validateGymAccess(req, template.gymId);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this schedule template'
      });
      return;
    }
    
    res.status(200).json({
      success: true,
      data: { template }
    });
  } catch (error: any) {
    console.error('Error fetching schedule template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch schedule template',
      error: error.message
    });
  }
};

// POST /api/schedule-templates - Create new template
export const createScheduleTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      description,
      gymId: requestGymId,
      isDefault,
      timeslots
    } = req.body;
    
    // Validate required fields
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Template name is required'
      });
      return;
    }
    
    // Determine gym ID
    let gymId: Types.ObjectId;
    
    if (req.user?.userType === 'admin') {
      if (!requestGymId) {
        res.status(400).json({
          success: false,
          message: 'Gym ID is required for admin users'
        });
        return;
      }
      gymId = new Types.ObjectId(requestGymId);
    } else {
      if (!req.user?.gymId) {
        res.status(400).json({
          success: false,
          message: 'User must be assigned to a gym'
        });
        return;
      }
      gymId = new Types.ObjectId(req.user.gymId);
    }
    
    // Validate gym exists
    const gym = await Gym.findById(gymId);
    if (!gym) {
      res.status(400).json({
        success: false,
        message: 'Gym not found'
      });
      return;
    }
    
    // Validate permission to manage schedules
    if (req.user?.userType !== 'admin' && 
        req.user?.userType !== 'gym_owner' && 
        req.user?.userType !== 'coach') {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to create schedule templates'
      });
      return;
    }
    
    // Check for duplicate template names within gym
    const existingTemplate = await ScheduleTemplate.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') },
      gymId,
      isActive: true
    });
    
    if (existingTemplate) {
      res.status(409).json({
        success: false,
        message: 'A schedule template with this name already exists'
      });
      return;
    }
    
    // Validate timeslots if provided
    if (timeslots && timeslots.length > 0) {
      // Validate each timeslot
      for (const slot of timeslots) {
        // Validate coach belongs to gym
        if (slot.coachId) {
          const coachValid = await validateCoachAccess(new Types.ObjectId(slot.coachId), gymId);
          if (!coachValid) {
            res.status(400).json({
              success: false,
              message: `Coach ${slot.coachId} does not belong to this gym or is not active`
            });
            return;
          }
        }
        
        // Validate program belongs to gym (if specified)
        if (slot.programId) {
          const programValid = await validateProgramAccess(new Types.ObjectId(slot.programId), gymId);
          if (!programValid) {
            res.status(400).json({
              success: false,
              message: `Workout program ${slot.programId} does not belong to this gym or is not active`
            });
            return;
          }
        }
        
        // Validate location exists in gym (simplified - assuming locationId is valid)
        if (!Types.ObjectId.isValid(slot.locationId)) {
          res.status(400).json({
            success: false,
            message: 'Invalid location ID in timeslot'
          });
          return;
        }
      }
      
      // Check for timeslot conflicts
      const conflicts = (ScheduleTemplate as any).validateTimeslotConflicts(timeslots);
      if (conflicts.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Timeslot conflicts detected',
          conflicts
        });
        return;
      }
    }
    
    // Create template
    const templateData: Partial<IScheduleTemplate> = {
      name: name.trim(),
      gymId,
      description: description?.trim(),
      isDefault: !!isDefault,
      timeslots: timeslots || [],
      createdBy: new Types.ObjectId(req.user!.id)
    };
    
    const template = new ScheduleTemplate(templateData);
    await template.save();
    
    // Populate related data for response
    await template.populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'timeslots.coachId', select: 'name email' },
      { path: 'timeslots.programId', select: 'name description' }
    ]);
    
    res.status(201).json({
      success: true,
      data: { template },
      message: 'Schedule template created successfully'
    });
  } catch (error: any) {
    console.error('Error creating schedule template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create schedule template',
      error: error.message
    });
  }
};

// PUT /api/schedule-templates/:id - Update template
export const updateScheduleTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      isDefault,
      timeslots
    } = req.body;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid schedule template ID'
      });
      return;
    }
    
    const template = await ScheduleTemplate.findOne({
      _id: new Types.ObjectId(id),
      isActive: true
    });
    
    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Schedule template not found'
      });
      return;
    }
    
    // Check gym access
    const hasAccess = await validateGymAccess(req, template.gymId);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied to update this schedule template'
      });
      return;
    }
    
    // Check permissions
    if (req.user?.userType !== 'admin' && 
        req.user?.userType !== 'gym_owner' && 
        req.user?.userType !== 'coach') {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to update schedule templates'
      });
      return;
    }
    
    // Check for name conflicts if name is being changed
    if (name && name !== template.name) {
      const existingTemplate = await ScheduleTemplate.findOne({
        name: { $regex: new RegExp('^' + name + '$', 'i') },
        gymId: template.gymId,
        _id: { $ne: new Types.ObjectId(id) },
        isActive: true
      });
      
      if (existingTemplate) {
        res.status(409).json({
          success: false,
          message: 'A schedule template with this name already exists'
        });
        return;
      }
    }
    
    // Validate timeslots if provided
    if (timeslots && timeslots.length > 0) {
      // Validate each timeslot
      for (const slot of timeslots) {
        // Validate coach belongs to gym
        if (slot.coachId) {
          const coachValid = await validateCoachAccess(new Types.ObjectId(slot.coachId), template.gymId);
          if (!coachValid) {
            res.status(400).json({
              success: false,
              message: `Coach ${slot.coachId} does not belong to this gym or is not active`
            });
            return;
          }
        }
        
        // Validate program belongs to gym (if specified)
        if (slot.programId) {
          const programValid = await validateProgramAccess(new Types.ObjectId(slot.programId), template.gymId);
          if (!programValid) {
            res.status(400).json({
              success: false,
              message: `Workout program ${slot.programId} does not belong to this gym or is not active`
            });
            return;
          }
        }
        
        // Validate location exists in gym
        if (!Types.ObjectId.isValid(slot.locationId)) {
          res.status(400).json({
            success: false,
            message: 'Invalid location ID in timeslot'
          });
          return;
        }
      }
      
      // Check for timeslot conflicts
      const conflicts = (ScheduleTemplate as any).validateTimeslotConflicts(timeslots);
      if (conflicts.length > 0) {
        res.status(400).json({
          success: false,
          message: 'Timeslot conflicts detected',
          conflicts
        });
        return;
      }
    }
    
    // Update fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim();
    if (isDefault !== undefined) updateData.isDefault = !!isDefault;
    if (timeslots !== undefined) updateData.timeslots = timeslots;
    
    const updatedTemplate = await ScheduleTemplate.findByIdAndUpdate(
      new Types.ObjectId(id),
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'createdBy', select: 'name email' },
      { path: 'timeslots.coachId', select: 'name email' },
      { path: 'timeslots.programId', select: 'name description' }
    ]);
    
    res.status(200).json({
      success: true,
      data: { template: updatedTemplate },
      message: 'Schedule template updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating schedule template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update schedule template',
      error: error.message
    });
  }
};

// DELETE /api/schedule-templates/:id - Soft delete template
export const deleteScheduleTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid schedule template ID'
      });
      return;
    }
    
    const template = await ScheduleTemplate.findOne({
      _id: new Types.ObjectId(id),
      isActive: true
    });
    
    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Schedule template not found'
      });
      return;
    }
    
    // Check gym access
    const hasAccess = await validateGymAccess(req, template.gymId);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied to delete this schedule template'
      });
      return;
    }
    
    // Check permissions
    if (req.user?.userType !== 'admin' && 
        req.user?.userType !== 'gym_owner') {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to delete schedule templates'
      });
      return;
    }
    
    // TODO: Check for dependencies (active weekly schedules using this template)
    // This will be implemented when we add WeeklySchedule model
    
    // Soft delete
    template.isActive = false;
    template.isDefault = false; // Remove default flag when deleting
    await template.save();
    
    res.status(200).json({
      success: true,
      message: 'Schedule template deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting schedule template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete schedule template',
      error: error.message
    });
  }
};

// POST /api/schedule-templates/:id/set-default - Set as default template
export const setDefaultTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid schedule template ID'
      });
      return;
    }
    
    const template = await ScheduleTemplate.findOne({
      _id: new Types.ObjectId(id),
      isActive: true
    });
    
    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Schedule template not found'
      });
      return;
    }
    
    // Check gym access
    const hasAccess = await validateGymAccess(req, template.gymId);
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        message: 'Access denied to modify this schedule template'
      });
      return;
    }
    
    // Check permissions
    if (req.user?.userType !== 'admin' && 
        req.user?.userType !== 'gym_owner') {
      res.status(403).json({
        success: false,
        message: 'Insufficient permissions to set default template'
      });
      return;
    }
    
    // Set as default (pre-save middleware will handle removing default from others)
    template.isDefault = true;
    await template.save();
    
    res.status(200).json({
      success: true,
      data: { template },
      message: 'Schedule template set as default successfully'
    });
  } catch (error: any) {
    console.error('Error setting default template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default template',
      error: error.message
    });
  }
};