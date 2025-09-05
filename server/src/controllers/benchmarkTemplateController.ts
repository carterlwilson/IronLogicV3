import { Response } from 'express';
import { Types } from 'mongoose';
import BenchmarkTemplate, { IBenchmarkTemplate } from '../models/BenchmarkTemplate';
import { AuthRequest } from '../middleware/auth';

// Helper function to build query filters
const buildQueryFilters = (query: any, userGymId?: Types.ObjectId) => {
  const filters: any = { isActive: true };
  
  // Gym filtering: admins can see all gyms' templates, others see only their gym
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
  
  // Unit filtering
  if (query.unit) {
    filters.unit = query.unit;
  }
  
  // Tags filtering
  if (query.tags) {
    const tagsArray = Array.isArray(query.tags) ? query.tags : [query.tags];
    filters.tags = { $in: tagsArray };
  }
  
  // Text search
  if (query.search) {
    filters.$text = { $search: query.search };
  }
  
  return filters;
};

// GET /api/benchmark-templates - List benchmark templates with filtering, pagination, and sorting
export const getBenchmarkTemplates = async (req: AuthRequest, res: Response): Promise<void> => {
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
    const [benchmarkTemplates, total] = await Promise.all([
      BenchmarkTemplate.find(filters)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('gymId', 'name')
        .populate('createdBy', 'name')
        .lean(),
      BenchmarkTemplate.countDocuments(filters)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      success: true,
      data: {
        benchmarkTemplates,
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
    console.error('Error fetching benchmark templates:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch benchmark templates',
      error: error.message
    });
  }
};

// GET /api/benchmark-templates/:id - Get single benchmark template
export const getBenchmarkTemplateById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid benchmark template ID'
      });
      return;
    }
    
    const benchmarkTemplate = await BenchmarkTemplate.findOne({
      _id: new Types.ObjectId(id),
      isActive: true
    }).populate([
      { path: 'gymId', select: 'name' },
      { path: 'createdBy', select: 'name' }
    ]);
    
    if (!benchmarkTemplate) {
      res.status(404).json({
        success: false,
        message: 'Benchmark template not found'
      });
      return;
    }
    
    // Check gym access for non-admin users
    if (req.user?.userType !== 'admin') {
      const userGymId = req.user?.gymId?.toString();
      const templateGymId = benchmarkTemplate.gymId?.toString();
      
      if (templateGymId && templateGymId !== userGymId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to this benchmark template'
        });
        return;
      }
    }

    // Transform to ensure proper ID format
    const templateJson = benchmarkTemplate.toJSON();
    const transformedTemplate = {
      ...templateJson,
      gymId: templateJson.gymId?._id || templateJson.gymId, // Ensure ID is string
      createdBy: templateJson.createdBy._id || templateJson.createdBy, // Ensure ID is string
      gym: templateJson.gymId, // Keep populated data for display
      creator: templateJson.createdBy // Keep populated data for display
    };

    res.status(200).json({
      success: true,
      data: { benchmarkTemplate: transformedTemplate }
    });
  } catch (error: any) {
    console.error('Error fetching benchmark template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch benchmark template',
      error: error.message
    });
  }
};

// POST /api/benchmark-templates - Create new benchmark template
export const createBenchmarkTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      name,
      gymId,
      type,
      unit,
      description,
      instructions,
      notes,
      tags
    } = req.body;
    
    // Validate required fields
    if (!name || !type || !unit) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: name, type, unit'
      });
      return;
    }
    
    // Always assign gymId - no global templates
    let assignedGymId: Types.ObjectId;
    
    if (req.user?.userType === 'admin') {
      // Admin can create templates for any gym
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
      // Non-admin users create templates for their gym
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
    const existingTemplate = await BenchmarkTemplate.findOne({
      name: { $regex: new RegExp('^' + name + '$', 'i') },
      gymId: assignedGymId,
      isActive: true
    });
    
    if (existingTemplate) {
      res.status(409).json({
        success: false,
        message: 'Benchmark template with this name already exists in this gym'
      });
      return;
    }
    
    // Create benchmark template
    const templateData: Partial<IBenchmarkTemplate> = {
      name: name.trim(),
      gymId: assignedGymId,
      type,
      unit,
      description: description?.trim(),
      instructions: instructions?.trim(),
      notes: notes?.trim(),
      tags: tags ? tags.map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [],
      createdBy: new Types.ObjectId(req.user!.id)
    };
    
    const benchmarkTemplate = new BenchmarkTemplate(templateData);
    await benchmarkTemplate.save();
    
    await benchmarkTemplate.populate([
      { path: 'gymId', select: 'name' },
      { path: 'createdBy', select: 'name' }
    ]);

    // Transform to ensure proper ID format
    const templateJson = benchmarkTemplate.toJSON();
    const transformedTemplate = {
      ...templateJson,
      gymId: templateJson.gymId?._id || templateJson.gymId, // Ensure ID is string
      createdBy: templateJson.createdBy._id || templateJson.createdBy, // Ensure ID is string
      gym: templateJson.gymId, // Keep populated data for display
      creator: templateJson.createdBy // Keep populated data for display
    };

    res.status(201).json({
      success: true,
      data: { benchmarkTemplate: transformedTemplate },
      message: 'Benchmark template created successfully'
    });
  } catch (error: any) {
    console.error('Error creating benchmark template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create benchmark template',
      error: error.message
    });
  }
};

// PUT /api/benchmark-templates/:id - Update benchmark template
export const updateBenchmarkTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const {
      name,
      type,
      unit,
      description,
      instructions,
      notes,
      tags
    } = req.body;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid benchmark template ID'
      });
      return;
    }
    
    const benchmarkTemplate = await BenchmarkTemplate.findOne({
      _id: new Types.ObjectId(id),
      isActive: true
    });
    
    if (!benchmarkTemplate) {
      res.status(404).json({
        success: false,
        message: 'Benchmark template not found'
      });
      return;
    }
    
    // Check permissions
    if (req.user?.userType === 'client') {
      res.status(403).json({
        success: false,
        message: 'Clients cannot edit benchmark templates'
      });
      return;
    }
    
    if (req.user?.userType !== 'admin') {
      const userGymId = req.user?.gymId?.toString();
      const templateGymId = benchmarkTemplate.gymId?.toString();
      
      // Allow editing only if template belongs to user's gym
      if (!templateGymId || templateGymId !== userGymId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to update this benchmark template'
        });
        return;
      }
    }
    
    // Check for name conflicts if name is being changed
    if (name && name !== benchmarkTemplate.name) {
      const existingTemplate = await BenchmarkTemplate.findOne({
        name: { $regex: new RegExp('^' + name + '$', 'i') },
        gymId: benchmarkTemplate.gymId,
        _id: { $ne: new Types.ObjectId(id) },
        isActive: true
      });
      
      if (existingTemplate) {
        res.status(409).json({
          success: false,
          message: 'Benchmark template with this name already exists in this scope'
        });
        return;
      }
    }
    
    // Update fields
    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim();
    if (type !== undefined) updateData.type = type;
    if (unit !== undefined) updateData.unit = unit;
    if (description !== undefined) updateData.description = description?.trim();
    if (instructions !== undefined) updateData.instructions = instructions?.trim();
    if (notes !== undefined) updateData.notes = notes?.trim();
    if (tags !== undefined) updateData.tags = tags ? tags.map((tag: string) => tag.trim()).filter((tag: string) => tag.length > 0) : [];
    
    const updatedTemplate = await BenchmarkTemplate.findByIdAndUpdate(
      new Types.ObjectId(id),
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'gymId', select: 'name' },
      { path: 'createdBy', select: 'name' }
    ]);
    
    // Transform to ensure proper ID format
    const templateJson = updatedTemplate!.toJSON();
    const transformedTemplate = {
      ...templateJson,
      gymId: templateJson.gymId?._id || templateJson.gymId, // Ensure ID is string
      createdBy: templateJson.createdBy._id || templateJson.createdBy, // Ensure ID is string
      gym: templateJson.gymId, // Keep populated data for display
      creator: templateJson.createdBy // Keep populated data for display
    };
    
    res.status(200).json({
      success: true,
      data: { benchmarkTemplate: transformedTemplate },
      message: 'Benchmark template updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating benchmark template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update benchmark template',
      error: error.message
    });
  }
};

// DELETE /api/benchmark-templates/:id - Hard delete benchmark template
export const deleteBenchmarkTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    
    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid benchmark template ID'
      });
      return;
    }
    
    const benchmarkTemplate = await BenchmarkTemplate.findOne({
      _id: new Types.ObjectId(id),
      isActive: true
    });
    
    if (!benchmarkTemplate) {
      res.status(404).json({
        success: false,
        message: 'Benchmark template not found'
      });
      return;
    }
    
    // Check permissions
    if (req.user?.userType === 'client') {
      res.status(403).json({
        success: false,
        message: 'Clients cannot delete benchmark templates'
      });
      return;
    }
    
    if (req.user?.userType !== 'admin') {
      const userGymId = req.user?.gymId?.toString();
      const templateGymId = benchmarkTemplate.gymId?.toString();
      
      // Allow deleting only if template belongs to user's gym
      if (!templateGymId || templateGymId !== userGymId) {
        res.status(403).json({
          success: false,
          message: 'Access denied to delete this benchmark template'
        });
        return;
      }
    }
    
    // TODO: When client benchmarks are implemented, add dependency checking here
    // to prevent deletion of templates that are referenced in client benchmarks
    
    // Hard delete the benchmark template
    await BenchmarkTemplate.findByIdAndDelete(new Types.ObjectId(id));
    
    res.status(200).json({
      success: true,
      message: 'Benchmark template deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting benchmark template:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete benchmark template',
      error: error.message
    });
  }
};

// GET /api/benchmark-templates/tags - Get distinct tags
export const getBenchmarkTags = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { gymId } = req.query;
    
    // Determine gym access
    let queryGymId = undefined;
    
    if (req.user?.userType === 'admin') {
      if (gymId && gymId !== 'all') {
        if (gymId === 'global') {
          // Only global benchmark templates
          queryGymId = null;
        } else if (Types.ObjectId.isValid(gymId as string)) {
          queryGymId = new Types.ObjectId(gymId as string);
        }
      }
      // If gymId is 'all' or undefined, queryGymId remains undefined (all templates)
    } else {
      // Non-admin users see their gym + global templates
      queryGymId = req.user?.gymId;
    }
    
    const tags = await (BenchmarkTemplate as any).getDistinctTags(queryGymId);
    
    res.status(200).json({
      success: true,
      data: { tags }
    });
  } catch (error: any) {
    console.error('Error fetching benchmark tags:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch benchmark tags',
      error: error.message
    });
  }
};