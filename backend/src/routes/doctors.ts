import { Router, Request, Response } from 'express';
import { query, validationResult, body } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireDoctor, AuthRequest } from '../middleware/auth';
import { getCache, setCache } from '../config/redis';
import { validatePaginationParams, calculatePagination, DoctorSearchFilters, PaginationParams } from '@amrutam/shared';

const router = Router();

/**
 * @swagger
 * /api/doctors:
 *   get:
 *     summary: Discover doctors with filters
 *     tags: [Doctors]
 *     parameters:
 *       - in: query
 *         name: specialization
 *         schema:
 *           type: string
 *       - in: query
 *         name: consultationMode
 *         schema:
 *           type: string
 *           enum: [ONLINE, IN_PERSON]
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxFee
 *         schema:
 *           type: number
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [rating, experience, consultationFee, createdAt]
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Doctors retrieved successfully
 */
router.get('/', [
  query('specialization').optional().isString(),
  query('consultationMode').optional().isIn(['ONLINE', 'IN_PERSON']),
  query('date').optional().isISO8601(),
  query('minRating').optional().isFloat({ min: 0, max: 5 }),
  query('maxFee').optional().isFloat({ min: 0 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('sortBy').optional().isIn(['rating', 'experience', 'consultationFee', 'createdAt']),
  query('sortOrder').optional().isIn(['asc', 'desc'])
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors.array()
      });
    }

    const {
      specialization,
      consultationMode,
      date,
      minRating,
      maxFee,
      page = 1,
      limit = 10,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.query;

    // Build cache key
    const cacheKey = `doctors:${JSON.stringify(req.query)}`;
    
    // Try to get from cache first
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    // Build where clause
    const where: any = {
      role: 'DOCTOR',
      isAvailable: true
    };

    if (specialization) {
      where.specialization = {
        contains: specialization as string,
        mode: 'insensitive'
      };
    }

    if (minRating) {
      where.rating = {
        gte: parseFloat(minRating as string)
      };
    }

    if (maxFee) {
      where.consultationFee = {
        lte: parseFloat(maxFee as string)
      };
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Validate pagination
    const pagination = validatePaginationParams({ page: Number(page), limit: Number(limit) });

    // Get doctors with pagination
    const doctors = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        experience: true,
        rating: true,
        totalConsultations: true,
        consultationFee: true,
        bio: true,
        profileImage: true,
        isAvailable: true,
        createdAt: true
      },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      orderBy: {
        [sortBy as string]: sortOrder
      }
    });

    // If date is specified, filter by available slots
    let doctorsWithSlots = doctors;
    if (date) {
      const targetDate = new Date(date as string);
      const availableSlots = await prisma.timeSlot.findMany({
        where: {
          date: targetDate,
          status: 'AVAILABLE',
          doctorId: { in: doctors.map(d => d.id) }
        },
        select: {
          doctorId: true,
          startTime: true,
          endTime: true
        }
      });

      // Group slots by doctor
      const slotsByDoctor = availableSlots.reduce((acc: Record<string, typeof availableSlots>, slot) => {
        if (!acc[slot.doctorId]) {
          acc[slot.doctorId] = [];
        }
        acc[slot.doctorId].push(slot);
        return acc;
      }, {});

      // Add available slots to doctors
      doctorsWithSlots = doctors.map(doctor => ({
        ...doctor,
        availableSlots: slotsByDoctor[doctor.id] || []
      }));

      // Filter by consultation mode if specified
      if (consultationMode) {
        // For now, we'll assume all doctors support both modes
        // In a real implementation, you'd store this preference
        doctorsWithSlots = doctorsWithSlots.filter((doctor: any) => 
          doctor.availableSlots.length > 0
        );
      }
    }

    const result = {
      success: true,
      data: doctorsWithSlots,
      pagination: calculatePagination(total, pagination.page, pagination.limit)
    };

    // Cache the result for 5 minutes
    await setCache(cacheKey, result, 300);

    res.json(result);
  } catch (error) {
    console.error('Get doctors error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get doctors'
    });
  }
});

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     summary: Get doctor details
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor details retrieved successfully
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Try to get from cache first
    const cacheKey = `doctor:${id}`;
    const cachedResult = await getCache(cacheKey);
    if (cachedResult) {
      return res.json(cachedResult);
    }

    const doctor = await prisma.user.findFirst({
      where: {
        id,
        role: 'DOCTOR'
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialization: true,
        experience: true,
        education: true,
        certifications: true,
        rating: true,
        totalConsultations: true,
        consultationFee: true,
        bio: true,
        profileImage: true,
        isAvailable: true,
        createdAt: true
      }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Get available slots for next 7 days
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);

    const availableSlots = await prisma.timeSlot.findMany({
      where: {
        doctorId: id,
        date: {
          gte: startDate,
          lte: endDate
        },
        status: 'AVAILABLE'
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    const result = {
      success: true,
      data: {
        ...doctor,
        availableSlots
      }
    };

    // Cache the result for 10 minutes
    await setCache(cacheKey, result, 600);

    res.json(result);
  } catch (error) {
    console.error('Get doctor error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get doctor details'
    });
  }
});

/**
 * @swagger
 * /api/doctors/{id}/recurring-rules:
 *   get:
 *     summary: Get doctor's recurring availability rules
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Recurring rules retrieved successfully
 */
router.get('/:id/recurring-rules', async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const rules = await prisma.recurringAvailabilityRule.findMany({
      where: { 
        doctorId: id,
        isActive: true 
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: rules
    });
  } catch (error) {
    console.error('Get recurring rules error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recurring rules'
    });
  }
});

/**
 * @swagger
 * /api/doctors/{id}/recurring-rules:
 *   post:
 *     summary: Create recurring availability rule (Doctor only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dayOfWeek:
 *                 type: integer
 *                 minimum: 0
 *                 maximum: 6
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Recurring rule created successfully
 */
router.post('/:id/recurring-rules', authenticateToken, requireDoctor, [
  body('dayOfWeek').isInt({ min: 0, max: 6 }),
  body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('endTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('startDate').isISO8601(),
  body('endDate').optional().isISO8601()
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { dayOfWeek, startTime, endTime, startDate, endDate } = req.body;

    // Verify the doctor is updating their own schedule
    if (req.user.id !== id) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own schedule'
      });
    }

    // Check for time conflicts
    const conflictingRule = await prisma.recurringAvailabilityRule.findFirst({
      where: {
        doctorId: id,
        dayOfWeek,
        isActive: true,
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } }
            ]
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } }
            ]
          }
        ]
      }
    });

    if (conflictingRule) {
      return res.status(400).json({
        success: false,
        error: 'Time slot conflicts with existing rule'
      });
    }

    const rule = await prisma.recurringAvailabilityRule.create({
      data: {
        doctorId: id,
        dayOfWeek,
        startTime,
        endTime,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null
      }
    });

    // Generate time slots based on this rule
    await generateTimeSlotsFromRule(rule);

    res.status(201).json({
      success: true,
      message: 'Recurring rule created successfully',
      data: rule
    });
  } catch (error) {
    console.error('Create recurring rule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create recurring rule'
    });
  }
});

/**
 * @swagger
 * /api/doctors/{id}/slots:
 *   get:
 *     summary: Get doctor's time slots for a specific date
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [AVAILABLE, BOOKED, LOCKED, CANCELLED]
 *       - in: query
 *         name: consultationMode
 *         schema:
 *           type: string
 *           enum: [ONLINE, IN_PERSON]
 *     responses:
 *       200:
 *         description: Time slots retrieved successfully
 */
router.get('/:id/slots', async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { date, status, consultationMode } = req.query;

    const whereClause: any = { doctorId: id };
    
    if (date) {
      whereClause.date = new Date(date);
    }
    
    if (status) {
      whereClause.status = status;
    }

    const slots = await prisma.timeSlot.findMany({
      where: whereClause,
      include: {
        appointment: {
          include: {
            patient: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    // Filter by consultation mode if specified
    let filteredSlots = slots;
    if (consultationMode) {
      filteredSlots = slots.filter(slot => {
        if (slot.appointment) {
          return slot.appointment.consultationMode === consultationMode;
        }
        return true; // Available slots can be either mode
      });
    }

    res.json({
      success: true,
      data: filteredSlots
    });
  } catch (error) {
    console.error('Get doctor slots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch time slots'
    });
  }
});

/**
 * @swagger
 * /api/doctors/{id}/stats:
 *   get:
 *     summary: Get doctor's statistics
 *     tags: [Doctors]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Doctor stats retrieved successfully
 */
router.get('/:id/stats', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get total appointments
    const totalAppointments = await prisma.appointment.count({
      where: { doctorId: id }
    });

    // Get today's appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayAppointments = await prisma.appointment.count({
      where: {
        doctorId: id,
        createdAt: {
          gte: today,
          lt: tomorrow
        }
      }
    });

    // Get average rating
    const doctor = await prisma.user.findUnique({
      where: { id },
      select: { rating: true }
    });

    // Get total unique patients
    const totalPatients = await prisma.appointment.groupBy({
      by: ['patientId'],
      where: { doctorId: id },
      _count: { patientId: true }
    });

    res.json({
      success: true,
      data: {
        totalAppointments,
        todayAppointments,
        averageRating: doctor?.rating || 0,
        totalPatients: totalPatients.length
      }
    });
  } catch (error) {
    console.error('Get doctor stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch doctor statistics'
    });
  }
});

// Helper function to generate time slots from recurring rules
async function generateTimeSlotsFromRule(rule: { startDate: Date | string; endDate?: Date | string | null; dayOfWeek: number; doctorId: string; id: string; startTime: string; endTime: string }) {
  const startDate = new Date(rule.startDate);
  const endDate = rule.endDate ? new Date(rule.endDate) : new Date();
  endDate.setDate(endDate.getDate() + 30); // Generate for next 30 days if no end date

  const slots = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (currentDate.getDay() === rule.dayOfWeek) {
      slots.push({
        doctorId: rule.doctorId,
        date: new Date(currentDate),
        startTime: rule.startTime,
        endTime: rule.endTime,
        status: 'AVAILABLE' as const,
        isRecurring: true,
        recurringRuleId: rule.id
      });
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  if (slots.length > 0) {
    await prisma.timeSlot.createMany({
      data: slots,
      skipDuplicates: true
    });
  }
}

/**
 * @swagger
 * /api/doctors/{id}/schedule:
 *   post:
 *     summary: Update doctor's schedule (Doctor only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - slots
 *             properties:
 *               slots:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     date:
 *                       type: string
 *                       format: date
 *                     startTime:
 *                       type: string
 *                     endTime:
 *                       type: string
 *     responses:
 *       200:
 *         description: Schedule updated successfully
 */
router.post('/:id/schedule', authenticateToken, requireDoctor, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { slots } = req.body;

    // Verify doctor is updating their own schedule
    if (!req.user || req.user.id !== id) {
      return res.status(403).json({
        success: false,
        error: 'Can only update own schedule'
      });
    }

    // Validate slots
    if (!Array.isArray(slots)) {
      return res.status(400).json({
        success: false,
        error: 'Slots must be an array'
      });
    }

    // Clear existing slots for the specified dates
    const dates = [...new Set(slots.map((slot: { date: string | Date }) => slot.date))];
    await prisma.timeSlot.deleteMany({
      where: {
        doctorId: id,
        date: {
          in: dates.map(date => new Date(date))
        }
      }
    });

    // Create new slots
    const slotData = slots.map((slot: { date: string | Date; startTime: string; endTime: string }) => ({
      doctorId: id,
      date: new Date(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'AVAILABLE' as const
    }));

    await prisma.timeSlot.createMany({
      data: slotData
    });

    // Clear cache
    await getCache(`doctor:${id}`);

    res.json({
      success: true,
      message: 'Schedule updated successfully'
    });
  } catch (error) {
    console.error('Update schedule error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update schedule'
    });
  }
});

export default router;
