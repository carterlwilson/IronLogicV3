import { Response } from 'express';
import { Types } from 'mongoose';
import WeeklySchedule from '../models/WeeklySchedule';
import ScheduleTemplate from '../models/ScheduleTemplate';
import { Client } from '../models/Client';
import { AuthRequest } from '../middleware/auth';

// Create weekly schedule from template
export const createWeeklySchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { templateId, notes } = req.body;
    const userId = req.user?.id;
    const userGymId = req.user?.gymId;

    if (!userId || !userGymId) {
      res.status(401).json({
        success: false,
        message: 'User authentication required'
      });
      return;
    }

    // Validate templateId
    if (!templateId || !Types.ObjectId.isValid(templateId)) {
      res.status(400).json({
        success: false,
        message: 'Valid template ID is required'
      });
      return;
    }

    // Verify template exists and belongs to user's gym
    const template = await ScheduleTemplate.findOne({
      _id: templateId,
      gymId: userGymId,
      isActive: true
    });

    if (!template) {
      res.status(404).json({ 
        success: false, 
        message: 'Schedule template not found or access denied' 
      });
      return;
    }

    // Create new weekly schedule from template
    const weeklySchedule = await (WeeklySchedule as any).createFromTemplate(
      new Types.ObjectId(templateId),
      new Types.ObjectId(userId)
    );

    if (notes) {
      weeklySchedule.notes = notes;
    }

    await weeklySchedule.save();

    // Populate references for response
    const populatedSchedule = await WeeklySchedule.findById(weeklySchedule._id)
      .populate('templateId', 'name description')
      .populate('createdBy', 'name email')
      .populate('timeslots.coachId', 'name email')
      .populate('timeslots.enrollments.clientId', 'personalInfo.firstName personalInfo.lastName');

    res.status(201).json({
      success: true,
      message: 'Weekly schedule created successfully',
      data: populatedSchedule
    });

  } catch (error) {
    console.error('Error creating weekly schedule:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create weekly schedule',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get weekly schedules for gym with filtering
export const getWeeklySchedules = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userGymId = req.user?.gymId;
    
    if (!userGymId) {
      res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
      return;
    }

    const {
      page = 1,
      limit = 20,
      status,
      templateId,
      coachId
    } = req.query;

    // Build filter
    const filter: any = { 
      gymId: userGymId,
      isActive: true 
    };

    if (status) {
      filter.status = status;
    }

    if (templateId && Types.ObjectId.isValid(templateId as string)) {
      filter.templateId = templateId;
    }

    if (coachId && Types.ObjectId.isValid(coachId as string)) {
      filter['timeslots.coachId'] = coachId;
    }


    const pageNum = Math.max(1, parseInt(page as string));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as string)));
    const skip = (pageNum - 1) * limitNum;

    // Get schedules with pagination
    const [schedules, total] = await Promise.all([
      WeeklySchedule.find(filter)
        .populate('templateId', 'name description')
        .populate('createdBy', 'name email')
        .populate('publishedBy', 'name email')
        .populate('timeslots.coachId', 'name email')
          .populate('timeslots.enrollments.clientId', 'personalInfo.firstName personalInfo.lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      WeeklySchedule.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: schedules,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      }
    });

  } catch (error) {
    console.error('Error fetching weekly schedules:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch weekly schedules',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get specific weekly schedule by ID
export const getWeeklyScheduleById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userGymId = req.user?.gymId;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid schedule ID is required' 
      });
      return;
    }

    if (!userGymId) {
      res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
      return;
    }

    const schedule = await WeeklySchedule.findOne({
      _id: id,
      gymId: userGymId,
      isActive: true
    })
      .populate('templateId', 'name description')
      .populate('createdBy', 'name email')
      .populate('publishedBy', 'name email')
      .populate('timeslots.coachId', 'name email')
      .populate('timeslots.enrollments.clientId', 'personalInfo.firstName personalInfo.lastName membershipInfo');

    if (!schedule) {
      res.status(404).json({ 
        success: false, 
        message: 'Weekly schedule not found' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: schedule
    });

  } catch (error) {
    console.error('Error fetching weekly schedule:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch weekly schedule',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Update weekly schedule
export const updateWeeklySchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userGymId = req.user?.gymId;
    const userRole = req.user?.userType;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid schedule ID is required' 
      });
      return;
    }

    if (!userGymId) {
      res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
      return;
    }

    // Only gym owners and admins can update schedules
    if (userRole !== 'admin' && userRole !== 'gym_owner') {
      res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions to update schedule' 
      });
      return;
    }

    const { notes, status, timeslots } = req.body;

    const schedule = await WeeklySchedule.findOne({
      _id: id,
      gymId: userGymId,
      isActive: true
    });

    if (!schedule) {
      res.status(404).json({ 
        success: false, 
        message: 'Weekly schedule not found' 
      });
      return;
    }

    // Validate status transition
    if (status && !['draft', 'published', 'active', 'completed', 'cancelled'].includes(status)) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid status value' 
      });
      return;
    }

    // Prevent modification of completed or cancelled schedules
    if (schedule.status === 'completed' || schedule.status === 'cancelled') {
      res.status(400).json({ 
        success: false, 
        message: 'Cannot modify completed or cancelled schedules' 
      });
      return;
    }

    // Update fields
    if (notes !== undefined) {
      schedule.notes = notes;
    }

    if (status) {
      schedule.status = status;
      if (status === 'published' && !schedule.publishedAt) {
        schedule.publishedAt = new Date();
        schedule.publishedBy = new Types.ObjectId(req.user!.id);
      }
    }

    // Update timeslots if provided
    if (timeslots && Array.isArray(timeslots)) {
      // Validate timeslot updates don't break existing enrollments
      for (const updatedSlot of timeslots) {
        const existingSlot = schedule.timeslots.find(slot => 
          slot.timeslotId.toString() === updatedSlot.timeslotId
        );
        
        if (existingSlot && existingSlot.enrollments.length > 0) {
          // Prevent capacity reduction below current enrollments
          const enrolledCount = existingSlot.enrollments.filter(e => e.status === 'enrolled').length;
          if (updatedSlot.maxCapacity < enrolledCount) {
            res.status(400).json({ 
              success: false, 
              message: `Cannot reduce capacity below current enrollments (${enrolledCount}) for timeslot ${updatedSlot.timeslotId}` 
            });
            return;
          }
        }
      }

      // Apply timeslot updates
      schedule.timeslots = timeslots;
    }

    await schedule.save();

    // Return updated schedule with populated references
    const updatedSchedule = await WeeklySchedule.findById(schedule._id)
      .populate('templateId', 'name description')
      .populate('createdBy', 'name email')
      .populate('publishedBy', 'name email')
      .populate('timeslots.coachId', 'name email')
      .populate('timeslots.enrollments.clientId', 'personalInfo.firstName personalInfo.lastName');

    res.status(200).json({
      success: true,
      message: 'Weekly schedule updated successfully',
      data: updatedSchedule
    });

  } catch (error) {
    console.error('Error updating weekly schedule:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update weekly schedule',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Enroll client in timeslot
export const enrollClient = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scheduleId, timeslotId } = req.params;
    const { clientId, notes } = req.body;
    const userGymId = req.user?.gymId;

    if (!scheduleId || !Types.ObjectId.isValid(scheduleId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid schedule ID is required' 
      });
      return;
    }

    if (!timeslotId || !Types.ObjectId.isValid(timeslotId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid timeslot ID is required' 
      });
      return;
    }

    if (!clientId || !Types.ObjectId.isValid(clientId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid client ID is required' 
      });
      return;
    }

    if (!userGymId) {
      res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
      return;
    }

    // Verify client belongs to the same gym
    const client = await Client.findOne({
      _id: clientId,
      gymId: userGymId,
      'membershipInfo.isActive': true
    });

    if (!client) {
      res.status(404).json({ 
        success: false, 
        message: 'Client not found or not active' 
      });
      return;
    }

    // Enroll client using model static method
    const updatedSchedule = await (WeeklySchedule as any).enrollClient(
      new Types.ObjectId(scheduleId),
      new Types.ObjectId(timeslotId),
      new Types.ObjectId(clientId),
      notes
    );

    // Return updated schedule with populated references
    const populatedSchedule = await WeeklySchedule.findById(updatedSchedule._id)
      .populate('timeslots.enrollments.clientId', 'personalInfo.firstName personalInfo.lastName membershipInfo');

    res.status(200).json({
      success: true,
      message: 'Client enrolled successfully',
      data: populatedSchedule
    });

  } catch (error) {
    console.error('Error enrolling client:', error);
    
    if (error instanceof Error) {
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to enroll client',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
};

// Cancel client enrollment
export const cancelEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { scheduleId, timeslotId, clientId } = req.params;
    const userGymId = req.user?.gymId;

    if (!scheduleId || !Types.ObjectId.isValid(scheduleId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid schedule ID is required' 
      });
      return;
    }

    if (!timeslotId || !Types.ObjectId.isValid(timeslotId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid timeslot ID is required' 
      });
      return;
    }

    if (!clientId || !Types.ObjectId.isValid(clientId)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid client ID is required' 
      });
      return;
    }

    if (!userGymId) {
      res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
      return;
    }

    // Cancel enrollment using model static method
    const updatedSchedule = await (WeeklySchedule as any).cancelEnrollment(
      new Types.ObjectId(scheduleId),
      new Types.ObjectId(timeslotId),
      new Types.ObjectId(clientId)
    );

    // Return updated schedule with populated references
    const populatedSchedule = await WeeklySchedule.findById(updatedSchedule._id)
      .populate('timeslots.enrollments.clientId', 'personalInfo.firstName personalInfo.lastName membershipInfo');

    res.status(200).json({
      success: true,
      message: 'Client enrollment cancelled successfully',
      data: populatedSchedule
    });

  } catch (error) {
    console.error('Error cancelling enrollment:', error);
    
    if (error instanceof Error) {
      res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to cancel enrollment',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  }
};

// Delete weekly schedule (soft delete)
export const deleteWeeklySchedule = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userGymId = req.user?.gymId;
    const userRole = req.user?.userType;

    if (!id || !Types.ObjectId.isValid(id)) {
      res.status(400).json({ 
        success: false, 
        message: 'Valid schedule ID is required' 
      });
      return;
    }

    if (!userGymId) {
      res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
      return;
    }

    // Only gym owners and admins can delete schedules
    if (userRole !== 'admin' && userRole !== 'gym_owner') {
      res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions to delete schedule' 
      });
      return;
    }

    const schedule = await WeeklySchedule.findOne({
      _id: id,
      gymId: userGymId,
      isActive: true
    });

    if (!schedule) {
      res.status(404).json({ 
        success: false, 
        message: 'Weekly schedule not found' 
      });
      return;
    }

    // Check if schedule has any active enrollments
    const hasActiveEnrollments = schedule.timeslots.some(slot => 
      slot.enrollments.some(enrollment => enrollment.status === 'enrolled')
    );

    if (hasActiveEnrollments) {
      res.status(400).json({ 
        success: false, 
        message: 'Cannot delete schedule with active client enrollments' 
      });
      return;
    }

    // Soft delete
    schedule.isActive = false;
    await schedule.save();

    res.status(200).json({
      success: true,
      message: 'Weekly schedule deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting weekly schedule:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete weekly schedule',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};

// Get schedule statistics for dashboard
export const getScheduleStats = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userGymId = req.user?.gymId;
    
    if (!userGymId) {
      res.status(401).json({ 
        success: false, 
        message: 'User authentication required' 
      });
      return;
    }

    const stats = await WeeklySchedule.aggregate([
      {
        $match: {
          gymId: userGymId,
          isActive: true
        }
      },
      {
        $facet: {
          // Current active schedules stats
          activeSchedules: [
            {
              $match: {
                status: { $in: ['published', 'active'] }
              }
            },
            {
              $unwind: '$timeslots'
            },
            {
              $group: {
                _id: null,
                totalTimeslots: { $sum: 1 },
                totalEnrollments: {
                  $sum: {
                    $size: {
                      $filter: {
                        input: '$timeslots.enrollments',
                        cond: { $eq: ['$$this.status', 'enrolled'] }
                      }
                    }
                  }
                },
                totalCapacity: { $sum: '$timeslots.maxCapacity' }
              }
            }
          ],
          // Overall stats
          overall: [
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ],
          // Recent utilization by schedule
          recentUtilization: [
            {
              $match: {
                createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
              }
            },
            {
              $unwind: '$timeslots'
            },
            {
              $group: {
                _id: '$_id',
                scheduleId: { $first: '$_id' },
                createdAt: { $first: '$createdAt' },
                enrollments: {
                  $sum: {
                    $size: {
                      $filter: {
                        input: '$timeslots.enrollments',
                        cond: { $eq: ['$$this.status', 'enrolled'] }
                      }
                    }
                  }
                },
                capacity: { $sum: '$timeslots.maxCapacity' }
              }
            },
            {
              $project: {
                scheduleId: 1,
                createdAt: 1,
                enrollments: 1,
                capacity: 1,
                utilization: {
                  $multiply: [
                    { $divide: ['$enrollments', '$capacity'] },
                    100
                  ]
                }
              }
            },
            { $sort: { createdAt: 1 } }
          ]
        }
      }
    ]);

    const result = stats[0];
    
    res.status(200).json({
      success: true,
      data: {
        activeSchedules: result.activeSchedules[0] || {
          totalTimeslots: 0,
          totalEnrollments: 0,
          totalCapacity: 0
        },
        schedulesByStatus: result.overall,
        recentUtilization: result.recentUtilization
      }
    });

  } catch (error) {
    console.error('Error fetching schedule stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch schedule statistics',
      error: process.env.NODE_ENV === 'development' ? error : undefined
    });
  }
};