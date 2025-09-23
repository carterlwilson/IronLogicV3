import { Response } from 'express';
import { Types } from 'mongoose';
import { Client } from '../models/Client';
import { ClientBenchmarkHistory } from '../models/ClientBenchmarkHistory';
import BenchmarkTemplate from '../models/BenchmarkTemplate';
import { AuthRequest } from '../middleware/auth';

// Helper function to check gym access
const checkGymAccess = (req: AuthRequest, clientGymId: string): boolean => {
  if (req.user?.userType === 'admin') {
    return true;
  }
  return req.user?.gymId === clientGymId;
};

// Helper function to build client query filters
const buildClientQuery = (
  search?: string,
  membershipStatus?: string,
  membershipType?: string,
  gymId?: string
) => {
  const query: any = {};

  // Search across user name and email
  if (search) {
    // We'll need to populate userId to search by name/email
    query.searchTerm = search;
  }

  // Filter by membership status
  if (membershipStatus === 'active') {
    query['membershipInfo.isActive'] = true;
  } else if (membershipStatus === 'inactive') {
    query['membershipInfo.isActive'] = false;
  }

  // Filter by membership type
  if (membershipType) {
    query['membershipInfo.membershipType'] = membershipType;
  }

  // Filter by gym (for admin users)
  if (gymId) {
    query.gymId = new Types.ObjectId(gymId);
  }

  return query;
};

// GET /api/clients - List clients with filtering/pagination
export const getClients = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '50',
      search,
      membershipStatus,
      membershipType,
      gymId,
      sort = '-createdAt'
    } = req.query;

    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Build base query
    const query = buildClientQuery(
      search as string,
      membershipStatus as string,
      membershipType as string,
      gymId as string
    );

    // Gym-based authorization
    if (req.user?.userType !== 'admin') {
      if (!req.user?.gymId) {
        res.status(403).json({
          success: false,
          message: 'Access denied: User not assigned to a gym'
        });
        return;
      }
      query.gymId = new Types.ObjectId(req.user.gymId);
    }

    // Parse sort parameter
    const sortObj: any = {};
    const sortFields = (sort as string).split(',');
    sortFields.forEach(field => {
      if (field.startsWith('-')) {
        sortObj[field.substring(1)] = -1;
      } else {
        sortObj[field] = 1;
      }
    });

    // Build aggregation pipeline for search functionality
    let pipeline: any[] = [
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user'
        }
      },
      {
        $unwind: '$user'
      }
    ];

    // Add search filter if provided
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { 'user.name': { $regex: search, $options: 'i' } },
            { 'user.email': { $regex: search, $options: 'i' } }
          ]
        }
      });
    }

    // Add other filters
    const matchStage: any = {};
    Object.keys(query).forEach(key => {
      if (key !== 'searchTerm') {
        matchStage[key] = query[key];
      }
    });

    if (Object.keys(matchStage).length > 0) {
      pipeline.push({ $match: matchStage });
    }

    // Add sorting
    pipeline.push({ $sort: sortObj });

    // Count total documents
    const countPipeline = [...pipeline, { $count: 'total' }];
    const countResult = await Client.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Add pagination
    pipeline.push({ $skip: skip }, { $limit: limitNum });

    // Add additional lookups for populated data
    pipeline.push(
      {
        $lookup: {
          from: 'gyms',
          localField: 'gymId',
          foreignField: '_id',
          as: 'gym'
        }
      },
      {
        $lookup: {
          from: 'workoutprograms',
          localField: 'currentProgram.programId',
          foreignField: '_id',
          as: 'program'
        }
      },
      {
        $lookup: {
          from: 'benchmarktemplates',
          localField: 'activeBenchmarks.templateId',
          foreignField: '_id',
          as: 'benchmarkTemplates'
        }
      }
    );

    // Execute query
    const clients = await Client.aggregate(pipeline);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        clients,
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

  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching clients'
    });
  }
};

// GET /api/clients/:id - Get client with full profile
export const getClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
      return;
    }

    const client = await Client.findById(id)
      .populate('userId', 'name email userType isActive')
      .populate('gymId', 'name location')
      .populate('currentProgram.programId', 'name description blocks')
      .populate('activeBenchmarks.templateId', 'name type unit description')
      .populate('coachAssignments.coachId', 'name email')
      .populate('personalInfo.preferences.preferredCoaches', 'name email')
      .lean();

    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found'
      });
      return;
    }

    // Check gym access
    if (!checkGymAccess(req, client.gymId.toString())) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this client'
      });
      return;
    }

    res.json({
      success: true,
      data: { client }
    });

  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client'
    });
  }
};

// PUT /api/clients/:id - Update client profile
export const updateClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
      return;
    }

    const client = await Client.findById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found'
      });
      return;
    }

    // Check gym access
    if (!checkGymAccess(req, client.gymId.toString())) {
      res.status(403).json({
        success: false,
        message: 'Access denied to update this client'
      });
      return;
    }

    // Remove sensitive fields that shouldn't be updated directly
    const { userId, gymId, _id, createdAt, updatedAt, ...allowedUpdates } = updateData;

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email userType isActive')
      .populate('gymId', 'name location')
      .populate('currentProgram.programId', 'name description')
      .populate('activeBenchmarks.templateId', 'name type unit description')
      .populate('coachAssignments.coachId', 'name email')
      .lean();

    res.json({
      success: true,
      data: { client: updatedClient },
      message: 'Client updated successfully'
    });

  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating client'
    });
  }
};

// GET /api/clients/:id/benchmarks - Get client's benchmarks
export const getClientBenchmarks = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { page = '1', limit = '50', templateId } = req.query;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
      return;
    }

    const client = await Client.findById(id).lean();
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found'
      });
      return;
    }

    // Check gym access
    if (!checkGymAccess(req, client.gymId.toString())) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this client'
      });
      return;
    }

    // Parse pagination
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query: any = { clientId: id, isActive: true };
    if (templateId) {
      query.templateId = new Types.ObjectId(templateId as string);
    }

    // Get benchmark history
    const [benchmarks, total] = await Promise.all([
      ClientBenchmarkHistory.find(query)
        .populate('templateId', 'name type unit description instructions')
        .populate('recordedBy', 'name email')
        .sort({ recordedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ClientBenchmarkHistory.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        benchmarks,
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

  } catch (error) {
    console.error('Error fetching client benchmarks:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client benchmarks'
    });
  }
};

// POST /api/clients/:id/benchmarks - Add new benchmark
export const addClientBenchmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { templateId, value, notes } = req.body;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
      return;
    }

    if (!templateId || !Types.ObjectId.isValid(templateId)) {
      res.status(400).json({
        success: false,
        message: 'Valid template ID is required'
      });
      return;
    }

    if (!value || typeof value !== 'object') {
      res.status(400).json({
        success: false,
        message: 'Benchmark value is required'
      });
      return;
    }

    const client = await Client.findById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found'
      });
      return;
    }

    // Check gym access
    if (!checkGymAccess(req, client.gymId.toString())) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this client'
      });
      return;
    }

    // Verify benchmark template exists and is accessible
    const template = await BenchmarkTemplate.findOne({
      _id: templateId,
      isActive: true,
      $or: [
        { gymId: client.gymId },
        { gymId: null } // Global templates
      ]
    });

    if (!template) {
      res.status(404).json({
        success: false,
        message: 'Benchmark template not found or not accessible'
      });
      return;
    }

    // Create benchmark history record
    const benchmarkHistory = new ClientBenchmarkHistory({
      clientId: id,
      templateId,
      value,
      notes,
      recordedBy: req.user!.id
    });

    await benchmarkHistory.save();

    // Update client's active benchmarks
    const existingBenchmarkIndex = client.activeBenchmarks.findIndex(
      b => b.templateId.toString() === templateId
    );

    if (existingBenchmarkIndex >= 0) {
      // Update existing benchmark
      client.activeBenchmarks[existingBenchmarkIndex] = {
        templateId: templateId as any,
        currentValue: value,
        lastUpdated: new Date(),
        notes
      };
    } else {
      // Add new benchmark
      client.activeBenchmarks.push({
        templateId: templateId as any,
        currentValue: value,
        lastUpdated: new Date(),
        notes
      });
    }

    await client.save();

    // Return populated benchmark
    await benchmarkHistory.populate('templateId', 'name type unit description');
    await benchmarkHistory.populate('recordedBy', 'name email');

    res.status(201).json({
      success: true,
      data: { benchmark: benchmarkHistory },
      message: 'Benchmark added successfully'
    });

  } catch (error) {
    console.error('Error adding client benchmark:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding client benchmark'
    });
  }
};

// PUT /api/clients/:id/benchmarks/:benchmarkId - Update benchmark (24-hour rule)
export const updateClientBenchmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, benchmarkId } = req.params;
    const { value, notes } = req.body;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
      return;
    }

    if (!benchmarkId || !Types.ObjectId.isValid(benchmarkId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid benchmark ID format'
      });
      return;
    }

    const client = await Client.findById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found'
      });
      return;
    }

    // Check gym access
    if (!checkGymAccess(req, client.gymId.toString())) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this client'
      });
      return;
    }

    // Find benchmark history record
    const benchmark = await ClientBenchmarkHistory.findOne({
      _id: benchmarkId,
      clientId: id,
      isActive: true
    });

    if (!benchmark) {
      res.status(404).json({
        success: false,
        message: 'Benchmark not found'
      });
      return;
    }

    // Check 24-hour edit window
    const hoursSinceCreation = (Date.now() - benchmark.recordedAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      res.status(403).json({
        success: false,
        message: 'Benchmark can only be edited within 24 hours of creation. Use replace endpoint instead.'
      });
      return;
    }

    // Update benchmark
    const updateData: any = {};
    if (value) updateData.value = value;
    if (notes !== undefined) updateData.notes = notes;

    const updatedBenchmark = await ClientBenchmarkHistory.findByIdAndUpdate(
      benchmarkId,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('templateId', 'name type unit description')
      .populate('recordedBy', 'name email')
      .lean();

    // Update client's active benchmarks
    const activeBenchmarkIndex = client.activeBenchmarks.findIndex(
      b => b.templateId.toString() === benchmark.templateId.toString()
    );

    if (activeBenchmarkIndex >= 0 && client.activeBenchmarks[activeBenchmarkIndex]) {
      client.activeBenchmarks[activeBenchmarkIndex].currentValue = value || benchmark.value;
      client.activeBenchmarks[activeBenchmarkIndex].lastUpdated = new Date();
      client.activeBenchmarks[activeBenchmarkIndex].notes = notes !== undefined ? notes : benchmark.notes;
      await client.save();
    }

    res.json({
      success: true,
      data: { benchmark: updatedBenchmark },
      message: 'Benchmark updated successfully'
    });

  } catch (error) {
    console.error('Error updating client benchmark:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating client benchmark'
    });
  }
};

// POST /api/clients/:id/benchmarks/:benchmarkId/replace - Replace old benchmark
export const replaceClientBenchmark = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id, benchmarkId } = req.params;
    const { value, notes } = req.body;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
      return;
    }

    if (!benchmarkId || !Types.ObjectId.isValid(benchmarkId)) {
      res.status(400).json({
        success: false,
        message: 'Invalid benchmark ID format'
      });
      return;
    }

    if (!value || typeof value !== 'object') {
      res.status(400).json({
        success: false,
        message: 'New benchmark value is required'
      });
      return;
    }

    const client = await Client.findById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found'
      });
      return;
    }

    // Check gym access
    if (!checkGymAccess(req, client.gymId.toString())) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this client'
      });
      return;
    }

    // Find old benchmark
    const oldBenchmark = await ClientBenchmarkHistory.findOne({
      _id: benchmarkId,
      clientId: id,
      isActive: true
    });

    if (!oldBenchmark) {
      res.status(404).json({
        success: false,
        message: 'Benchmark not found'
      });
      return;
    }

    // Create new benchmark record
    const newBenchmark = new ClientBenchmarkHistory({
      clientId: id,
      templateId: oldBenchmark.templateId,
      value,
      notes,
      recordedBy: req.user!.id
    });

    await newBenchmark.save();

    // Mark old benchmark as replaced
    oldBenchmark.replacedBy = newBenchmark._id as any;
    await oldBenchmark.save();

    // Update client's active benchmarks
    const activeBenchmarkIndex = client.activeBenchmarks.findIndex(
      b => b.templateId.toString() === oldBenchmark.templateId.toString()
    );

    if (activeBenchmarkIndex >= 0 && client.activeBenchmarks[activeBenchmarkIndex]) {
      client.activeBenchmarks[activeBenchmarkIndex].currentValue = value;
      client.activeBenchmarks[activeBenchmarkIndex].lastUpdated = new Date();
      client.activeBenchmarks[activeBenchmarkIndex].notes = notes;
      await client.save();
    }

    // Return populated new benchmark
    await newBenchmark.populate('templateId', 'name type unit description');
    await newBenchmark.populate('recordedBy', 'name email');

    res.status(201).json({
      success: true,
      data: { benchmark: newBenchmark },
      message: 'Benchmark replaced successfully'
    });

  } catch (error) {
    console.error('Error replacing client benchmark:', error);
    res.status(500).json({
      success: false,
      message: 'Error replacing client benchmark'
    });
  }
};

// GET /api/clients/:id/program-progress - Get current program position
export const getClientProgramProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
      return;
    }

    const client = await Client.findById(id)
      .populate('currentProgram.programId', 'name description blocks')
      .lean();

    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found'
      });
      return;
    }

    // Check gym access
    if (!checkGymAccess(req, client.gymId.toString())) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this client'
      });
      return;
    }

    if (!client.currentProgram) {
      res.json({
        success: true,
        data: {
          programProgress: null,
          message: 'Client is not enrolled in a program'
        }
      });
      return;
    }

    res.json({
      success: true,
      data: { programProgress: client.currentProgram }
    });

  } catch (error) {
    console.error('Error fetching client program progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching client program progress'
    });
  }
};

// PUT /api/clients/:id/program-progress - Update program progress
export const updateClientProgramProgress = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { currentWeek, currentDay, completedDays, notes } = req.body;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({
        success: false,
        message: 'Invalid client ID format'
      });
      return;
    }

    const client = await Client.findById(id);
    if (!client) {
      res.status(404).json({
        success: false,
        message: 'Client not found'
      });
      return;
    }

    // Check gym access
    if (!checkGymAccess(req, client.gymId.toString())) {
      res.status(403).json({
        success: false,
        message: 'Access denied to this client'
      });
      return;
    }

    if (!client.currentProgram) {
      res.status(400).json({
        success: false,
        message: 'Client is not enrolled in a program'
      });
      return;
    }

    // Update program progress
    const updateData: any = {};
    if (typeof currentWeek === 'number') updateData['currentProgram.currentWeek'] = currentWeek;
    if (typeof currentDay === 'number') updateData['currentProgram.currentDay'] = currentDay;
    if (Array.isArray(completedDays)) updateData['currentProgram.completedDays'] = completedDays;
    if (notes !== undefined) updateData['currentProgram.notes'] = notes;

    const updatedClient = await Client.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .populate('currentProgram.programId', 'name description blocks')
      .lean();

    res.json({
      success: true,
      data: { programProgress: updatedClient!.currentProgram },
      message: 'Program progress updated successfully'
    });

  } catch (error) {
    console.error('Error updating client program progress:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating client program progress'
    });
  }
};