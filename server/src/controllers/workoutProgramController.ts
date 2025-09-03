import { Response } from 'express';
import { Types } from 'mongoose';
import WorkoutProgram from '../models/WorkoutProgram';
import ActivityTemplate from '../models/ActivityTemplate';
import { AuthRequest } from '../middleware/auth';

// Get workout programs with filtering and pagination
export const getWorkoutPrograms = async (req: AuthRequest, res: Response) => {
  try {
    const {
      page = 1,
      limit = 20,
      search,
      isTemplate,
      gymId,
      sort = '-createdAt'
    } = req.query;

    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Build filters based on user role and permissions
    const filters: any = { isActive: true };

    // Role-based filtering
    if (user.userType === 'admin') {
      // Admin can see all programs, optionally filter by gymId
      if (gymId && gymId !== 'all') {
        if (!Types.ObjectId.isValid(gymId as string)) {
          return res.status(400).json({ success: false, message: 'Invalid gym ID' });
        }
        filters.gymId = new Types.ObjectId(gymId as string);
      }
    } else {
      // Non-admin users only see programs from their gym
      const userGymId = user.gymId;
      if (!userGymId) {
        return res.status(400).json({ success: false, message: 'User not assigned to a gym' });
      }
      filters.gymId = new Types.ObjectId(userGymId);
    }

    // Apply additional filters
    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (isTemplate !== undefined) {
      filters.isTemplate = isTemplate === 'true';
    }

    // Calculate pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query with population
    const [programs, total] = await Promise.all([
      WorkoutProgram.find(filters)
        .populate('gymId', 'name')
        .populate('blocks.weeks.days.activities.templateId', 'name type')
        .sort(sort as string)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      WorkoutProgram.countDocuments(filters)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.json({
      success: true,
      data: {
        programs,
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
    console.error('Error getting workout programs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve workout programs',
      error: error.message
    });
  }
};

// Get single workout program by ID
export const getWorkoutProgram = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid program ID' });
    }

    // Build query with permissions  
    const query: any = { _id: new Types.ObjectId(id), isActive: true };

    // Role-based access control
    if (user.userType !== 'admin') {
      const userGymId = user.gymId;
      if (!userGymId) {
        return res.status(400).json({ success: false, message: 'User not assigned to a gym' });
      }
      query.gymId = new Types.ObjectId(userGymId);
    }

    const program = await WorkoutProgram.findOne(query)
      .populate('gymId', 'name locations')
      .populate('blocks.weeks.days.activities.templateId', 'name type activityGroup equipment muscleGroups')
      .populate('parentProgramId', 'name version');

    if (!program) {
      return res.status(404).json({ success: false, message: 'Workout program not found' });
    }

    return res.json({
      success: true,
      data: { program }
    });
  } catch (error: any) {
    console.error('Error getting workout program:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve workout program',
      error: error.message
    });
  }
};

// Create new workout program
export const createWorkoutProgram = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const {
      name,
      gymId,
      description,
      blocks,
      isTemplate
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Program name is required' });
    }

    // Determine gymId based on user role
    let assignedGymId: Types.ObjectId;
    if (user.userType === 'admin') {
      if (!gymId) {
        return res.status(400).json({ success: false, message: 'Gym ID is required for admin users' });
      }
      if (!Types.ObjectId.isValid(gymId)) {
        return res.status(400).json({ success: false, message: 'Invalid gym ID' });
      }
      assignedGymId = new Types.ObjectId(gymId);
    } else {
      const userGymId = user.gymId;
      if (!userGymId) {
        return res.status(400).json({ success: false, message: 'User not assigned to a gym' });
      }
      assignedGymId = new Types.ObjectId(userGymId);
    }

    // Validate program structure
    const programData = {
      name: name.trim(),
      gymId: assignedGymId,
      description: description?.trim(),
      blocks: blocks || [],
      isTemplate: Boolean(isTemplate)
    };

    const structureErrors = (WorkoutProgram as any).validateStructure(programData);
    if (structureErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid program structure',
        errors: structureErrors
      });
    }

    // Check for duplicate names within the gym
    const existingProgram = await WorkoutProgram.findOne({
      gymId: assignedGymId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isActive: true
    });

    if (existingProgram) {
      return res.status(400).json({
        success: false,
        message: 'A program with this name already exists in this gym'
      });
    }

    // Validate that all referenced activity templates exist
    if (blocks && blocks.length > 0) {
      const templateIds = new Set<string>();
      blocks.forEach((block: any) => {
        if (block.weeks) {
          block.weeks.forEach((week: any) => {
            if (week.days) {
              week.days.forEach((day: any) => {
                if (day.activities) {
                  day.activities.forEach((activity: any) => {
                    if (activity.templateId) {
                      templateIds.add(activity.templateId);
                    }
                  });
                }
              });
            }
          });
        }
      });

      if (templateIds.size > 0) {
        const validTemplates = await ActivityTemplate.find({
          _id: { $in: Array.from(templateIds).map(id => new Types.ObjectId(id)) },
          isActive: true
        }).select('_id');

        const validTemplateIds = new Set(validTemplates.map(t => t._id.toString()));
        const invalidTemplateIds = Array.from(templateIds).filter(id => !validTemplateIds.has(id));

        if (invalidTemplateIds.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid activity template references',
            invalidTemplateIds
          });
        }
      }
    }

    // Create the program
    const program = new WorkoutProgram(programData);
    await program.save();

    // Populate the created program for response
    const populatedProgram = await WorkoutProgram.findById(program._id)
      .populate('gymId', 'name')
      .populate('blocks.weeks.days.activities.templateId', 'name type');

    return res.status(201).json({
      success: true,
      data: { program: populatedProgram },
      message: 'Workout program created successfully'
    });
  } catch (error: any) {
    console.error('Error creating workout program:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create workout program',
      error: error.message
    });
  }
};

// Update workout program
export const updateWorkoutProgram = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid program ID' });
    }

    // Find existing program with permissions check
    const query: any = { _id: new Types.ObjectId(id), isActive: true };
    if (user.userType !== 'admin') {
      const userGymId = user.gymId;
      if (!userGymId) {
        return res.status(400).json({ success: false, message: 'User not assigned to a gym' });
      }
      query.gymId = new Types.ObjectId(userGymId);
    }

    const existingProgram = await WorkoutProgram.findOne(query);
    if (!existingProgram) {
      return res.status(404).json({ success: false, message: 'Workout program not found' });
    }

    const {
      name,
      description,
      blocks,
      isTemplate
    } = req.body;

    // Prepare update data
    const updateData: any = {};
    
    if (name !== undefined) {
      if (!name.trim()) {
        return res.status(400).json({ success: false, message: 'Program name cannot be empty' });
      }
      
      // Check for duplicate names (excluding current program)
      const duplicateProgram = await WorkoutProgram.findOne({
        _id: { $ne: new Types.ObjectId(id) },
        gymId: existingProgram.gymId,
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        isActive: true
      });

      if (duplicateProgram) {
        return res.status(400).json({
          success: false,
          message: 'A program with this name already exists in this gym'
        });
      }
      
      updateData.name = name.trim();
    }

    if (description !== undefined) {
      updateData.description = description?.trim();
    }

    if (isTemplate !== undefined) {
      updateData.isTemplate = Boolean(isTemplate);
    }

    if (blocks !== undefined) {
      // Validate program structure
      const programData = {
        ...existingProgram.toObject(),
        ...updateData,
        blocks
      };

      const structureErrors = (WorkoutProgram as any).validateStructure(programData);
      if (structureErrors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid program structure',
          errors: structureErrors
        });
      }

      // Validate activity template references
      const templateIds = new Set<string>();
      blocks.forEach((block: any) => {
        if (block.weeks) {
          block.weeks.forEach((week: any) => {
            if (week.days) {
              week.days.forEach((day: any) => {
                if (day.activities) {
                  day.activities.forEach((activity: any) => {
                    if (activity.templateId) {
                      templateIds.add(activity.templateId);
                    }
                  });
                }
              });
            }
          });
        }
      });

      if (templateIds.size > 0) {
        const validTemplates = await ActivityTemplate.find({
          _id: { $in: Array.from(templateIds).map(id => new Types.ObjectId(id)) },
          isActive: true
        }).select('_id');

        const validTemplateIds = new Set(validTemplates.map(t => t._id.toString()));
        const invalidTemplateIds = Array.from(templateIds).filter(id => !validTemplateIds.has(id));

        if (invalidTemplateIds.length > 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid activity template references',
            invalidTemplateIds
          });
        }
      }

      updateData.blocks = blocks;
    }

    // Increment version
    updateData.version = existingProgram.version + 1;
    updateData.updatedAt = new Date();

    // Update the program
    const updatedProgram = await WorkoutProgram.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('gymId', 'name')
      .populate('blocks.weeks.days.activities.templateId', 'name type');

    return res.json({
      success: true,
      data: { program: updatedProgram },
      message: 'Workout program updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating workout program:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update workout program',
      error: error.message
    });
  }
};

// Soft delete workout program
export const deleteWorkoutProgram = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid program ID' });
    }

    // Find program with permissions check
    const query: any = { _id: new Types.ObjectId(id), isActive: true };
    if (user.userType !== 'admin') {
      const userGymId = user.gymId;
      if (!userGymId) {
        return res.status(400).json({ success: false, message: 'User not assigned to a gym' });
      }
      query.gymId = new Types.ObjectId(userGymId);
    }

    const program = await WorkoutProgram.findOne(query);
    if (!program) {
      return res.status(404).json({ success: false, message: 'Workout program not found' });
    }

    // Soft delete
    program.isActive = false;
    program.updatedAt = new Date();
    await program.save();

    return res.json({
      success: true,
      message: 'Workout program deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting workout program:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete workout program',
      error: error.message
    });
  }
};

// Copy workout program (create template or duplicate)
export const copyWorkoutProgram = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, isTemplate } = req.body;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid program ID' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'New program name is required' });
    }

    // Find source program
    const query: any = { _id: new Types.ObjectId(id), isActive: true };
    if (user.userType !== 'admin') {
      const userGymId = user.gymId;
      if (!userGymId) {
        return res.status(400).json({ success: false, message: 'User not assigned to a gym' });
      }
      query.gymId = new Types.ObjectId(userGymId);
    }

    const sourceProgram = await WorkoutProgram.findOne(query);
    if (!sourceProgram) {
      return res.status(404).json({ success: false, message: 'Source program not found' });
    }

    // Check for duplicate names
    const existingProgram = await WorkoutProgram.findOne({
      gymId: sourceProgram.gymId,
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      isActive: true
    });

    if (existingProgram) {
      return res.status(400).json({
        success: false,
        message: 'A program with this name already exists in this gym'
      });
    }

    // Create copy
    const programCopy = new WorkoutProgram({
      name: name.trim(),
      gymId: sourceProgram.gymId,
      description: sourceProgram.description,
      blocks: sourceProgram.blocks,
      isTemplate: Boolean(isTemplate),
      parentProgramId: sourceProgram._id,
      version: 1
    });

    await programCopy.save();

    // Populate for response
    const populatedCopy = await WorkoutProgram.findById(programCopy._id)
      .populate('gymId', 'name')
      .populate('parentProgramId', 'name version');

    return res.status(201).json({
      success: true,
      data: { program: populatedCopy },
      message: 'Workout program copied successfully'
    });
  } catch (error: any) {
    console.error('Error copying workout program:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to copy workout program',
      error: error.message
    });
  }
};

// Get volume calculations for a program
export const getVolumeCalculations = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!id || !Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid program ID' });
    }

    // Find program with permissions
    const query: any = { _id: new Types.ObjectId(id), isActive: true };
    if (user.userType !== 'admin') {
      const userGymId = user.gymId;
      if (!userGymId) {
        return res.status(400).json({ success: false, message: 'User not assigned to a gym' });
      }
      query.gymId = new Types.ObjectId(userGymId);
    }

    const program = await WorkoutProgram.findOne(query)
      .populate('blocks.weeks.days.activities.templateId', 'name activityGroup');

    if (!program) {
      return res.status(404).json({ success: false, message: 'Workout program not found' });
    }

    // Build activity group map
    const activityGroupMap = new Map<string, string>();
    program.blocks.forEach(block => {
      block.weeks.forEach(week => {
        week.days.forEach(day => {
          day.activities.forEach(activity => {
            const template = activity.templateId as any;
            if (template && template.activityGroup) {
              activityGroupMap.set(template._id.toString(), template.activityGroup);
            }
          });
        });
      });
    });

    // Calculate volume percentages for each block
    const blockCalculations = program.blocks.map(block => {
      const percentages = (WorkoutProgram as any).calculateVolumePercentages(block, activityGroupMap);
      return {
        blockId: block.blockId,
        blockName: block.name,
        volumeTargets: block.volumeTargets,
        actualPercentages: Array.from(percentages.entries()).map((entry) => {
          const [group, percentage] = entry as [string, number];
          return {
            activityGroup: group,
            actualPercentage: percentage
          };
        })
      };
    });

    return res.json({
      success: true,
      data: {
        programId: program._id,
        programName: program.name,
        blockCalculations
      }
    });
  } catch (error: any) {
    console.error('Error calculating volume:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate volume',
      error: error.message
    });
  }
};