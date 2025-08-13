import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { query } from 'express-validator';

const router = Router();

/**
 * @swagger
 * /api/users/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               bio:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 */
router.put('/profile', authenticateToken, [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().isMobilePhone('any'),
  body('bio').optional().isString()
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

    const { firstName, lastName, phone, bio, ...otherFields } = req.body;
    const userId = req.user.id;

    // Build update data
    const updateData: any = {};
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone) updateData.phone = phone;
    if (bio) updateData.bio = bio;

    // Add role-specific fields
    if (req.user.role === 'DOCTOR') {
      if (otherFields.specialization) updateData.specialization = otherFields.specialization;
      if (otherFields.experience) updateData.experience = parseInt(otherFields.experience);
      if (otherFields.consultationFee) updateData.consultationFee = parseFloat(otherFields.consultationFee);
      if (otherFields.education) updateData.education = otherFields.education;
      if (otherFields.certifications) updateData.certifications = otherFields.certifications;
    } else if (req.user.role === 'PATIENT') {
      if (otherFields.dateOfBirth) updateData.dateOfBirth = new Date(otherFields.dateOfBirth);
      if (otherFields.gender) updateData.gender = otherFields.gender;
      if (otherFields.medicalHistory) updateData.medicalHistory = otherFields.medicalHistory;
      if (otherFields.emergencyContact) updateData.emergencyContact = otherFields.emergencyContact;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        medicalHistory: true,
        emergencyContact: true,
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
        updatedAt: true
      }
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

/**
 * @swagger
 * /api/users/password:
 *   put:
 *     summary: Change user password
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */
router.put('/password', authenticateToken, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 })
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

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { password: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    res.json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
});

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [PATIENT, DOCTOR, ADMIN]
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
 *         description: Users retrieved successfully
 */
router.get('/', authenticateToken, requireAdmin, [
  query('role').optional().isIn(['PATIENT', 'DOCTOR', 'ADMIN']),
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

    const { role, page = 1, limit = 10 } = req.query;

    // Build where clause
    const where: any = {};
    if (role) {
      where.role = role;
    }

    // Get total count
    const total = await prisma.user.count({ where });

    // Get users with pagination
    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        phone: true,
        createdAt: true,
        updatedAt: true
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: users,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users'
    });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Users]
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
 *         description: User deleted successfully
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req: any, res) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Prevent admin from deleting themselves
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account'
      });
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user'
    });
  }
});

export default router;
