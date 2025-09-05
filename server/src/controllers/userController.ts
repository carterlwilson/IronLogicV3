import { Response } from 'express';
import { User, IUser } from '../models/User';
import { Client } from '../models/Client';
import { AuthRequest } from '../middleware/auth';
import { Types } from 'mongoose';

// Helper function to build query filters
const buildUserQuery = (search?: string, userType?: string, gymId?: string) => {
  const query: any = {};

  // Search across name and email
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by user type
  if (userType && ['admin', 'gym_owner', 'coach', 'client'].includes(userType)) {
    query.userType = userType;
  }

  // Filter by gym ID (for non-admin users)
  if (gymId) {
    query.gymId = gymId;
  }

  // Exclude inactive users (soft deleted)
  query.isActive = true;

  return query;
};

// GET /api/users - List users with pagination, filtering, sorting
export const getUsers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '50', search, userType, gymId, sort = '-createdAt' } = req.query;
    
    // Parse pagination parameters
    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = buildUserQuery(
      search as string, 
      userType as string, 
      gymId as string
    );

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
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -refreshTokens -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .populate({ path: 'gymId', select: 'name location' })
        .lean(),
      User.countDocuments(query)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        users,
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
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  }
};

// GET /api/users/:id - Get single user
export const getUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID parameter exists
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
      return;
    }

    const user = await User.findOne({ _id: id, isActive: true })
      .select('-password -refreshTokens -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil')
      .populate({ path: 'gymId', select: 'name location' })
      .lean();

    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // If user is a client, include client data
    let clientData = null;
    if (user.userType === 'client') {
      clientData = await Client.findOne({ userId: id })
        .populate('currentProgram.programId', 'name description')
        .populate('activeBenchmarks.templateId', 'name type unit')
        .populate('coachAssignments.coachId', 'name email')
        .lean();
    }

    // Transform to ensure proper ID format
    const transformedUser = {
      ...user,
      gymId: (user.gymId as any)?._id || user.gymId, // Ensure ID is string
      gym: user.gymId // Keep populated data for display
    };

    res.json({
      success: true,
      data: {
        user: transformedUser,
        ...(clientData && { clientProfile: clientData })
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user'
    });
  }
};

// POST /api/users - Create new user
export const createUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { email, password, name, userType, gymId, clientProfile } = req.body;

    // Validate required fields
    if (!email || !password || !name || !userType) {
      res.status(400).json({
        success: false,
        message: 'Missing required fields: email, password, name, userType'
      });
      return;
    }

    // Validate user type
    if (!['admin', 'gym_owner', 'coach', 'client'].includes(userType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
      return;
    }

    // Validate gymId for non-admin users
    if (userType !== 'admin' && !gymId) {
      res.status(400).json({
        success: false,
        message: 'Gym ID is required for non-admin users'
      });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
      return;
    }

    // Create user
    const userData: Partial<IUser> = {
      email: email.toLowerCase(),
      password,
      name,
      userType,
      ...(userType !== 'admin' && gymId && { gymId: new Types.ObjectId(gymId) }),
      isActive: true
    };

    const user = new User(userData);
    await user.save();

    // Auto-create client record for client users
    if (userType === 'client') {
      const clientData = {
        userId: user._id,
        gymId: new Types.ObjectId(gymId),
        personalInfo: clientProfile?.personalInfo || {},
        membershipInfo: {
          joinDate: new Date(),
          membershipType: clientProfile?.membershipType || 'standard',
          isActive: true
        },
        activeBenchmarks: []
      };

      const client = new Client(clientData);
      await client.save();
    }

    // Return user without sensitive data
    const userResponse = await User.findById(user._id)
      .select('-password -refreshTokens -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil')
      .populate({ path: 'gymId', select: 'name location' })
      .lean();

    res.status(201).json({
      success: true,
      data: { user: userResponse },
      message: 'User created successfully'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user'
    });
  }
};

// PUT /api/users/:id - Update user
export const updateUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { email, name, userType, gymId, isActive, clientProfile } = req.body;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
      return;
    }

    // Find user
    const user = await User.findOne({ _id: id, isActive: true });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Validate email uniqueness if changing
    if (email && email.toLowerCase() !== user.email) {
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
        return;
      }
    }

    // Validate user type change
    if (userType && !['admin', 'gym_owner', 'coach', 'client'].includes(userType)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user type'
      });
      return;
    }

    // Update user fields
    const updateData: any = {};
    if (email) updateData.email = email.toLowerCase();
    if (name) updateData.name = name;
    if (userType) updateData.userType = userType;
    if (gymId) updateData.gymId = new Types.ObjectId(gymId);
    if (typeof isActive === 'boolean') updateData.isActive = isActive;

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password -refreshTokens -passwordResetToken -passwordResetExpires -loginAttempts -lockUntil')
     .populate({ path: 'gymId', select: 'name location' })
     .lean();

    // Handle client profile updates
    if (user.userType === 'client' && clientProfile) {
      await Client.findOneAndUpdate(
        { userId: id },
        { $set: clientProfile },
        { new: true, upsert: true }
      );
    }

    // If user type changed to client, create client record
    if (userType === 'client' && user.userType !== 'client') {
      const clientGymId = gymId ? new Types.ObjectId(gymId) : user.gymId;
      const clientData = {
        userId: new Types.ObjectId(id),
        gymId: clientGymId,
        personalInfo: clientProfile?.personalInfo || {},
        membershipInfo: {
          joinDate: new Date(),
          membershipType: clientProfile?.membershipType || 'standard',
          isActive: true
        },
        activeBenchmarks: []
      };

      const client = new Client(clientData);
      await client.save();
    }

    // Transform to ensure proper ID format
    const transformedUser = {
      ...updatedUser!,
      gymId: (updatedUser!.gymId as any)?._id || updatedUser!.gymId, // Ensure ID is string
      gym: updatedUser!.gymId // Keep populated data for display
    };

    res.json({
      success: true,
      data: { user: transformedUser },
      message: 'User updated successfully'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating user'
    });
  }
};

// DELETE /api/users/:id - Soft delete user
export const deleteUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate ID parameter exists
    if (!id) {
      res.status(400).json({
        success: false,
        message: 'User ID is required'
      });
      return;
    }

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
      return;
    }

    // Find user
    const user = await User.findOne({ _id: id, isActive: true });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Prevent self-deletion
    if (req.user && req.user.id === id) {
      res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
      return;
    }

    // Soft delete user
    user.isActive = false;
    await user.save();

    // Also soft delete client record if exists
    if (user.userType === 'client') {
      await Client.findOneAndUpdate(
        { userId: id },
        { $set: { 'membershipInfo.isActive': false } }
      );
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting user'
    });
  }
};

// POST /api/users/:id/reset-password - Admin password reset
export const resetUserPassword = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Validate ObjectId
    if (!Types.ObjectId.isValid(id as string)) {
      res.status(400).json({
        success: false,
        message: 'Invalid user ID format'
      });
      return;
    }

    // Validate new password
    if (!newPassword) {
      res.status(400).json({
        success: false,
        message: 'New password is required'
      });
      return;
    }

    // Find user
    const user = await User.findOne({ _id: id, isActive: true });
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User not found'
      });
      return;
    }

    // Update password and clear lock fields
    user.password = newPassword;
    user.refreshTokens = []; // Clear all refresh tokens to force re-login
    user.loginAttempts = 0; // Reset login attempts
    
    // Save user (this will trigger password hashing)
    await user.save();
    
    // Remove any account lock using direct update
    await User.findByIdAndUpdate(user._id, {
      $unset: { lockUntil: "" }
    });

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting password'
    });
  }
};