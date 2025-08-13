import { Router } from 'express';
import { query, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireDoctor } from '../middleware/auth';
import { getCache, setCache } from '../config/redis';
import { validatePaginationParams, calculatePagination } from '@amrutam/shared';

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
      const slotsByDoctor = availableSlots.reduce((acc, slot) => {
        if (!acc[slot.doctorId]) {
          acc[slot.doctorId] = [];
        }
        acc[slot.doctorId].push(slot);
        return acc;
      }, {} as Record<string, any[]>);

      // Add available slots to doctors
      doctorsWithSlots = doctors.map(doctor => ({
        ...doctor,
        availableSlots: slotsByDoctor[doctor.id] || []
      })) as any[];

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
 * /api/doctors/{id}/slots:
 *   get:
 *     summary: Get doctor's available slots
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
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Slots retrieved successfully
 */
router.get('/:id/slots', [
  query('date').optional().isISO8601(),
  query('startDate').optional().isISO8601(),
  query('endDate').optional().isISO8601()
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
    const { date, startDate, endDate } = req.query;

    // Verify doctor exists
    const doctor = await prisma.user.findFirst({
      where: {
        id,
        role: 'DOCTOR'
      }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: 'Doctor not found'
      });
    }

    // Build date filter
    let dateFilter: any = {};
    if (date) {
      const targetDate = new Date(date as string);
      dateFilter.date = targetDate;
    } else if (startDate && endDate) {
      dateFilter.date = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string)
      };
    } else {
      // Default to next 7 days
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 7);
      dateFilter.date = {
        gte: start,
        lte: end
      };
    }

    const slots = await prisma.timeSlot.findMany({
      where: {
        doctorId: id,
        ...dateFilter
      },
      select: {
        id: true,
        date: true,
        startTime: true,
        endTime: true,
        status: true
      },
      orderBy: [
        { date: 'asc' },
        { startTime: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: slots
    });
  } catch (error) {
    console.error('Get doctor slots error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get doctor slots'
    });
  }
});

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
router.post('/:id/schedule', authenticateToken, requireDoctor, async (req: any, res) => {
  try {
    const { id } = req.params;
    const { slots } = req.body;

    // Verify doctor is updating their own schedule
    if (req.user.id !== id) {
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
    const dates = [...new Set(slots.map((slot: any) => slot.date))];
    await prisma.timeSlot.deleteMany({
      where: {
        doctorId: id,
        date: {
          in: dates.map(date => new Date(date))
        }
      }
    });

    // Create new slots
    const slotData = slots.map((slot: any) => ({
      doctorId: id,
      date: new Date(slot.date),
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: 'AVAILABLE' as any
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
