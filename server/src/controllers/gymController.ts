import { Response } from 'express';
import { Gym } from '../models/Gym';
import { User } from '../models/User';
import { Client } from '../models/Client';
import { AuthRequest } from '../middleware/auth';
import { Types } from 'mongoose';

// Helper function to build gym query based on user role
const buildGymQuery = (user: any, search?: string) => {
  const query: any = { isActive: true };

  // Role-based filtering
  if (user.userType === 'gym_owner') {
    query.ownerId = user.id;
  }
  // Admin sees all gyms, so no additional filtering

  // Search functionality
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { 'address.city': { $regex: search, $options: 'i' } },
      { 'address.state': { $regex: search, $options: 'i' } }
    ];
  }

  return query;
};

// GET /api/gyms - List gyms with role-based filtering
export const getGyms = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20', search, sort = '-createdAt' } = req.query;
    
    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Build query based on user role
    const query = buildGymQuery(req.user, search as string);

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

    // Execute query with pagination
    const [gyms, total] = await Promise.all([
      Gym.find(query)
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate('ownerId', 'name email')
        .lean(),
      Gym.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        gyms,
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
    console.error('Error fetching gyms:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gyms'
    });
  }
};

// GET /api/gyms/:id - Get single gym with locations
export const getGym = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID parameter exists
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Gym ID is required'
      });
      return;
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid gym ID format'
      });
      return;
    }

    // Build query based on user role
    const query: any = { _id: id, isActive: true };
    if (req.user?.userType === 'gym_owner') {
      query.ownerId = req.user.id;
    }

    const gym = await Gym.findOne(query)
      .populate('ownerId', 'name email phone')
      .lean();

    if (!gym) {
      res.status(404).json({
        success: false,
        message: 'Gym not found or access denied'
      });
      return;
    }

    // Filter out inactive locations for non-admin users
    if (req.user?.userType !== 'admin') {
      gym.locations = gym.locations.filter(location => location.isActive);
    }

    // Transform to ensure proper ID format
    const transformedGym = {
      ...gym,
      ownerId: (gym.ownerId as any)?._id || gym.ownerId, // Ensure ID is string
      owner: gym.ownerId // Keep populated data for display
    };

    res.json({
      success: true,
      data: { gym: transformedGym }
    });

  } catch (error) {
    console.error('Error fetching gym:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gym'
    });
  }
};

// POST /api/gyms - Create new gym (admin only)
export const createGym = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, ownerId, description, phone, email, website, address, locations, settings, subscription } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: name'
      });
      return;
    }

    // Validate owner if provided
    if (ownerId) {
      const owner = await User.findOne({ 
        _id: ownerId, 
        userType: 'gym_owner', 
        isActive: true 
      });

      if (!owner) {
        res.status(400).json({
          success: false,
          message: 'Invalid owner ID or owner must be a gym owner'
        });
        return;
      }

      // Check if owner already owns another gym
      const existingOwnership = await Gym.findOne({ 
        ownerId, 
        isActive: true 
      });

      if (existingOwnership) {
        res.status(400).json({
          success: false,
          message: 'This user already owns another gym'
        });
        return;
      }
    }

    // Check if gym name already exists
    const existingGym = await Gym.findOne({ 
      name: { $regex: new RegExp('^' + name + '$', 'i') },
      isActive: true
    });

    if (existingGym) {
      res.status(409).json({
        success: false,
        message: 'Gym with this name already exists'
      });
      return;
    }

    // Create gym
    const gymData: any = {
      name,
      ownerId: ownerId ? new Types.ObjectId(ownerId) : null,
      description,
      phone,
      email,
      website,
      address,
      locations: locations || [],
      settings: {
        ...settings,
        timezone: settings?.timezone || 'America/New_York',
        currency: settings?.currency || 'USD',
        membershipTypes: settings?.membershipTypes || ['standard', 'premium'],
        classCapacityDefault: settings?.classCapacityDefault || 20,
        bookingWindowDays: settings?.bookingWindowDays || 7,
        cancellationPolicy: settings?.cancellationPolicy || {
          enabled: true,
          hoursBefore: 24,
          penaltyType: 'none',
          penaltyAmount: 0
        }
      },
      statistics: {
        coachCount: 0,
        clientCount: 0,
        totalMembers: 0,
        activePrograms: 0,
        lastUpdated: new Date()
      },
      subscription: subscription || {
        plan: 'basic',
        status: 'trial',
        startDate: new Date(),
        maxMembers: 100,
        maxCoaches: 5
      },
      isActive: true
    };

    const gym = new Gym(gymData);
    await gym.save();

    // Return gym with populated owner data
    const savedGym = await Gym.findById(gym._id)
      .populate('ownerId', 'name email phone')
      .lean();

    // Transform to ensure proper ID format
    const transformedGym = {
      ...savedGym!,
      ownerId: (savedGym!.ownerId as any)?._id || savedGym!.ownerId, // Ensure ID is string
      owner: savedGym!.ownerId // Keep populated data for display
    };

    res.status(201).json({
      success: true,
      data: { gym: transformedGym },
      message: 'Gym created successfully'
    });

  } catch (error) {
    console.error('Error creating gym:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating gym'
    });
  }
};

// PUT /api/gyms/:id - Update gym details
export const updateGym = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { name, ownerId, description, phone, email, website, address, locations, settings, subscription } = req.body;

    // Validate ID parameter exists
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Gym ID is required'
      });
      return;
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid gym ID format'
      });
      return;
    }

    // Build query based on user role
    const query: any = { _id: id, isActive: true };
    if (req.user?.userType === 'gym_owner') {
      query.ownerId = req.user.id;
    }

    // Find gym
    const gym = await Gym.findOne(query);
    if (!gym) {
      res.status(404).json({
        success: false,
        message: 'Gym not found or access denied'
      });
      return;
    }

    // Check if name change conflicts with existing gym
    if (name && name !== gym.name) {
      const existingGym = await Gym.findOne({
        name: { $regex: new RegExp('^' + name + '$', 'i') },
        _id: { $ne: id },
        isActive: true
      });

      if (existingGym) {
        res.status(409).json({
          success: false,
          message: 'Gym with this name already exists'
        });
        return;
      }
    }

    // Validate owner if provided and changed
    if (ownerId !== undefined && ownerId !== gym.ownerId?.toString()) {
      if (ownerId) {
        const owner = await User.findOne({ 
          _id: ownerId, 
          userType: 'gym_owner', 
          isActive: true 
        });

        if (!owner) {
          res.status(400).json({
            success: false,
            message: 'Invalid owner ID or owner must be a gym owner'
          });
          return;
        }

        // Check if owner already owns another gym
        const existingOwnership = await Gym.findOne({ 
          ownerId, 
          _id: { $ne: id },
          isActive: true 
        });

        if (existingOwnership) {
          res.status(400).json({
            success: false,
            message: 'This user already owns another gym'
          });
          return;
        }
      }
    }

    // Update gym fields
    const updateData: any = {};
    if (name) updateData.name = name;
    if (ownerId !== undefined) updateData.ownerId = ownerId ? new Types.ObjectId(ownerId) : null;
    if (description !== undefined) updateData.description = description;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (website !== undefined) updateData.website = website;
    if (address) updateData.address = { ...gym.address, ...address };
    if (locations) updateData.locations = locations;
    if (settings) updateData.settings = { ...gym.settings, ...settings };
    
    // Only admins can update subscription details
    if (subscription && req.user?.userType === 'admin') {
      updateData.subscription = { ...gym.subscription, ...subscription };
    }

    // Update gym
    const updatedGym = await Gym.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('ownerId', 'name email phone')
     .lean();

    // Transform to ensure proper ID format
    const transformedGym = {
      ...updatedGym!,
      ownerId: (updatedGym!.ownerId as any)?._id || updatedGym!.ownerId, // Ensure ID is string
      owner: updatedGym!.ownerId // Keep populated data for display
    };

    res.json({
      success: true,
      data: { gym: transformedGym },
      message: 'Gym updated successfully'
    });

  } catch (error) {
    console.error('Error updating gym:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating gym'
    });
  }
};

// DELETE /api/gyms/:id - Soft delete gym (admin only)
export const deleteGym = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID parameter exists
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Gym ID is required'
      });
      return;
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid gym ID format'
      });
      return;
    }

    // Find gym
    const gym = await Gym.findOne({ _id: id, isActive: true });
    if (!gym) {
      res.status(404).json({
        success: false,
        message: 'Gym not found'
      });
      return;
    }

    // Check if gym has active users
    const [activeCoaches, activeClients] = await Promise.all([
      User.countDocuments({ gymId: id, userType: 'coach', isActive: true }),
      Client.countDocuments({ gymId: id, 'membershipInfo.isActive': true })
    ]);

    if (activeCoaches > 0 || activeClients > 0) {
      res.status(400).json({
        success: false,
        message: `Cannot delete gym with ${activeCoaches} active coaches and ${activeClients} active clients. Please transfer or deactivate users first.`,
        data: {
          activeCoaches,
          activeClients
        }
      });
      return;
    }

    // Soft delete gym
    gym.isActive = false;
    await gym.save();

    res.json({
      success: true,
      message: 'Gym deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting gym:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting gym'
    });
  }
};

// GET /api/gyms/:id/stats - Gym statistics
export const getGymStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID parameter exists
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'Gym ID is required'
      });
      return;
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid gym ID format'
      });
      return;
    }

    // Build query based on user role
    const query: any = { _id: id, isActive: true };
    if (req.user?.userType === 'gym_owner') {
      query.ownerId = req.user.id;
    }

    // Find gym
    const gym = await Gym.findOne(query);
    if (!gym) {
      res.status(404).json({
        success: false,
        message: 'Gym not found or access denied'
      });
      return;
    }

    // Calculate real-time statistics
    const [
      coachCount,
      clientCount,
      activeClients,
      totalMembers,
      recentJoins
    ] = await Promise.all([
      User.countDocuments({ gymId: id, userType: 'coach', isActive: true }),
      Client.countDocuments({ gymId: id }),
      Client.countDocuments({ gymId: id, 'membershipInfo.isActive': true }),
      User.countDocuments({ gymId: id, userType: { $in: ['coach', 'client'] }, isActive: true }),
      Client.countDocuments({ 
        gymId: id, 
        'membershipInfo.joinDate': { 
          $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
        } 
      })
    ]);

    // Get membership breakdown
    const membershipBreakdown = await Client.aggregate([
      { $match: { gymId: new Types.ObjectId(id), 'membershipInfo.isActive': true } },
      { 
        $group: { 
          _id: '$membershipInfo.membershipType', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } }
    ]);

    // Update gym statistics
    gym.statistics = {
      coachCount,
      clientCount: activeClients,
      totalMembers,
      activePrograms: gym.statistics.activePrograms, // This would be calculated from actual program data
      lastUpdated: new Date()
    };
    await gym.save();

    const statistics = {
      overview: {
        coachCount,
        clientCount,
        activeClients,
        totalMembers,
        recentJoins,
        locations: gym.locations.filter(loc => loc.isActive).length
      },
      membership: {
        breakdown: membershipBreakdown,
        total: activeClients
      },
      growth: {
        newMembersLast30Days: recentJoins,
        // Additional growth metrics could be calculated here
      },
      facilities: {
        totalLocations: gym.locations.length,
        activeLocations: gym.locations.filter(loc => loc.isActive).length,
        totalCapacity: gym.locations
          .filter(loc => loc.isActive)
          .reduce((sum, loc) => sum + (loc.capacity || 0), 0)
      },
      lastUpdated: new Date()
    };

    res.json({
      success: true,
      data: { statistics }
    });

  } catch (error) {
    console.error('Error fetching gym statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching gym statistics'
    });
  }
};