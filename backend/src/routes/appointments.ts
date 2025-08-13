import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requirePatient, requireDoctor } from '../middleware/auth';
import { generateOTP, canCancelOrReschedule } from '@amrutam/shared';
import { getCache, deleteCache } from '../config/redis';

const router = Router();

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get user's appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, CONFIRMED, COMPLETED, CANCELLED, RESCHEDULED]
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
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 */
router.get('/', authenticateToken, [
  query('status').optional().isIn(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
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

    const { status, page = 1, limit = 10 } = req.query;
    const userId = req.user.id;

    // Build where clause
    const where: any = {};
    if (req.user.role === 'PATIENT') {
      where.patientId = userId;
    } else if (req.user.role === 'DOCTOR') {
      where.doctorId = userId;
    }

    if (status) {
      where.status = status;
    }

    // Get total count
    const total = await prisma.appointment.count({ where });

    // Get appointments with pagination
    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
            consultationFee: true
          }
        },
        slot: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true
          }
        }
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: appointments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get appointments'
    });
  }
});

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     summary: Get appointment details
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Appointment details retrieved successfully
 */
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialization: true,
            consultationFee: true
          }
        },
        slot: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true
          }
        }
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Check if user has access to this appointment
    if (req.user.role !== 'ADMIN' && 
        appointment.patientId !== userId && 
        appointment.doctorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: appointment
    });
  } catch (error) {
    console.error('Get appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get appointment details'
    });
  }
});

/**
 * @swagger
 * /api/appointments/slots/{slotId}/lock:
 *   post:
 *     summary: Lock a slot for 5 minutes
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
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
 *               - consultationMode
 *             properties:
 *               consultationMode:
 *                 type: string
 *                 enum: [ONLINE, IN_PERSON]
 *               symptoms:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Slot locked successfully
 */
router.post('/slots/:slotId/lock', authenticateToken, requirePatient, [
  body('consultationMode').isIn(['ONLINE', 'IN_PERSON']),
  body('symptoms').optional().isString(),
  body('notes').optional().isString()
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

    const { slotId } = req.params;
    const { consultationMode, symptoms, notes } = req.body;
    const patientId = req.user.id;

    // Check if slot exists and is available
    const slot = await prisma.timeSlot.findUnique({
      where: { id: slotId },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            consultationFee: true
          }
        }
      }
    });

    if (!slot) {
      return res.status(404).json({
        success: false,
        error: 'Slot not found'
      });
    }

    if (slot.status !== 'AVAILABLE') {
      return res.status(400).json({
        success: false,
        error: 'Slot is not available'
      });
    }

    // Check if slot is in the future
    const slotDateTime = new Date(slot.date);
    const [hours, minutes] = slot.startTime.split(':').map(Number);
    slotDateTime.setHours(hours, minutes, 0, 0);
    
    if (slotDateTime <= new Date()) {
      return res.status(400).json({
        success: false,
        error: 'Cannot book past slots'
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
    const lockedUntil = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Lock the slot
    await prisma.timeSlot.update({
      where: { id: slotId },
      data: {
        status: 'LOCKED',
        lockedUntil
      }
    });

    // Create slot lock record
    const slotLock = await prisma.slotLock.create({
      data: {
        slotId,
        patientId,
        lockedUntil,
        otp,
        otpExpiresAt
      }
    });

    // Clear cache
    await deleteCache(`doctor:${slot.doctor.id}`);

    res.json({
      success: true,
      message: 'Slot locked successfully',
      data: {
        slotLockId: slotLock.id,
        otp,
        expiresAt: otpExpiresAt,
        doctor: slot.doctor,
        slot: {
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime
        }
      }
    });
  } catch (error) {
    console.error('Lock slot error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to lock slot'
    });
  }
});

/**
 * @swagger
 * /api/appointments/slots/{slotId}/confirm:
 *   post:
 *     summary: Confirm appointment with OTP
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slotId
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
 *               - otp
 *             properties:
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment confirmed successfully
 */
router.post('/slots/:slotId/confirm', authenticateToken, requirePatient, [
  body('otp').isLength({ min: 6, max: 6 })
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

    const { slotId } = req.params;
    const { otp } = req.body;
    const patientId = req.user.id;

    // Verify slot lock and OTP
    const slotLock = await prisma.slotLock.findFirst({
      where: {
        slotId,
        patientId,
        otp,
        otpExpiresAt: { gt: new Date() }
      },
      include: {
        slot: {
          include: {
            doctor: true
          }
        }
      }
    });

    if (!slotLock) {
      return res.status(400).json({
        success: false,
        error: 'Invalid OTP or slot lock expired'
      });
    }

    // Check if slot is still locked
    if (slotLock.slot.status !== 'LOCKED') {
      return res.status(400).json({
        success: false,
        error: 'Slot is no longer locked'
      });
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        doctorId: slotLock.slot.doctorId,
        slotId,
        status: 'CONFIRMED',
        consultationMode: 'ONLINE', // Default, can be updated
        symptoms: '',
        notes: ''
      }
    });

    // Update slot status
    await prisma.timeSlot.update({
      where: { id: slotId },
      data: {
        status: 'BOOKED',
        appointmentId: appointment.id
      }
    });

    // Remove slot lock
    await prisma.slotLock.delete({
      where: { id: slotLock.id }
    });

    // Clear cache
    await deleteCache(`doctor:${slotLock.slot.doctorId}`);

    // Emit real-time update
    const io = req.app.get('io');
    io.to(`doctor-${slotLock.slot.doctorId}`).emit('slot-booked', {
      slotId,
      appointmentId: appointment.id
    });

    res.json({
      success: true,
      message: 'Appointment confirmed successfully',
      data: {
        appointmentId: appointment.id,
        doctor: slotLock.slot.doctor,
        slot: {
          date: slotLock.slot.date,
          startTime: slotLock.slot.startTime,
          endTime: slotLock.slot.endTime
        }
      }
    });
  } catch (error) {
    console.error('Confirm appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to confirm appointment'
    });
  }
});

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   post:
 *     summary: Cancel appointment
 *     tags: [Appointments]
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
 *               - reason
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Appointment cancelled successfully
 */
router.post('/:id/cancel', authenticateToken, [
  body('reason').notEmpty().isString()
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
    const { reason } = req.body;
    const userId = req.user.id;

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        slot: true
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Check if user has permission to cancel
    if (req.user.role !== 'ADMIN' && 
        appointment.patientId !== userId && 
        appointment.doctorId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    // Check if appointment can be cancelled
    if (!canCancelOrReschedule(appointment.slot.date)) {
      return res.status(400).json({
        success: false,
        error: 'Appointments can only be cancelled more than 24 hours in advance'
      });
    }

    // Update appointment
    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: userId,
        cancellationReason: reason
      }
    });

    // Free up the slot
    await prisma.timeSlot.update({
      where: { id: appointment.slotId },
      data: {
        status: 'AVAILABLE',
        appointmentId: null
      }
    });

    // Clear cache
    await deleteCache(`doctor:${appointment.doctorId}`);

    res.json({
      success: true,
      message: 'Appointment cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel appointment'
    });
  }
});

/**
 * @swagger
 * /api/appointments/{id}/complete:
 *   post:
 *     summary: Mark appointment as completed (Doctor only)
 *     tags: [Appointments]
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
 *               prescription:
 *                 type: string
 *               followUpDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Appointment marked as completed
 */
router.post('/:id/complete', authenticateToken, requireDoctor, [
  body('prescription').optional().isString(),
  body('followUpDate').optional().isISO8601()
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
    const { prescription, followUpDate } = req.body;
    const doctorId = req.user.id;

    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: 'Appointment not found'
      });
    }

    // Verify doctor owns this appointment
    if (appointment.doctorId !== doctorId) {
      return res.status(403).json({
        success: false,
        error: 'Can only complete own appointments'
      });
    }

    // Update appointment
    await prisma.appointment.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        prescription,
        followUpDate: followUpDate ? new Date(followUpDate) : null
      }
    });

    res.json({
      success: true,
      message: 'Appointment marked as completed'
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to complete appointment'
    });
  }
});

export default router;
