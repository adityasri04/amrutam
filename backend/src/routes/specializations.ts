import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { prisma } from '../config/database';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

/**
 * @swagger
 * /api/specializations:
 *   get:
 *     summary: Get all specializations
 *     tags: [Specializations]
 *     responses:
 *       200:
 *         description: Specializations retrieved successfully
 */
router.get('/', async (req, res) => {
  try {
    const specializations = await prisma.specialization.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });

    res.json({
      success: true,
      data: specializations
    });
  } catch (error) {
    console.error('Get specializations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get specializations'
    });
  }
});

/**
 * @swagger
 * /api/specializations:
 *   post:
 *     summary: Create new specialization (Admin only)
 *     tags: [Specializations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - description
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *     responses:
 *       201:
 *         description: Specialization created successfully
 */
router.post('/', authenticateToken, requireAdmin, [
  body('name').trim().notEmpty(),
  body('description').trim().notEmpty(),
  body('icon').optional().isString()
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

    const { name, description, icon } = req.body;

    // Check if specialization already exists
    const existingSpecialization = await prisma.specialization.findUnique({
      where: { name }
    });

    if (existingSpecialization) {
      return res.status(400).json({
        success: false,
        error: 'Specialization with this name already exists'
      });
    }

    const specialization = await prisma.specialization.create({
      data: {
        name,
        description,
        icon
      }
    });

    res.status(201).json({
      success: true,
      message: 'Specialization created successfully',
      data: specialization
    });
  } catch (error) {
    console.error('Create specialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create specialization'
    });
  }
});

/**
 * @swagger
 * /api/specializations/{id}:
 *   put:
 *     summary: Update specialization (Admin only)
 *     tags: [Specializations]
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
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               icon:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Specialization updated successfully
 */
router.put('/:id', authenticateToken, requireAdmin, [
  body('name').optional().trim().notEmpty(),
  body('description').optional().trim().notEmpty(),
  body('icon').optional().isString(),
  body('isActive').optional().isBoolean()
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
    const { name, description, icon, isActive } = req.body;

    // Check if specialization exists
    const existingSpecialization = await prisma.specialization.findUnique({
      where: { id }
    });

    if (!existingSpecialization) {
      return res.status(404).json({
        success: false,
        error: 'Specialization not found'
      });
    }

    // Check if name is being changed and if it conflicts
    if (name && name !== existingSpecialization.name) {
      const nameConflict = await prisma.specialization.findUnique({
        where: { name }
      });

      if (nameConflict) {
        return res.status(400).json({
          success: false,
          error: 'Specialization with this name already exists'
        });
      }
    }

    // Build update data
    const updateData: any = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedSpecialization = await prisma.specialization.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: 'Specialization updated successfully',
      data: updatedSpecialization
    });
  } catch (error) {
    console.error('Update specialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update specialization'
    });
  }
});

/**
 * @swagger
 * /api/specializations/{id}:
 *   delete:
 *     summary: Delete specialization (Admin only)
 *     tags: [Specializations]
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
 *         description: Specialization deleted successfully
 */
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if specialization exists
    const specialization = await prisma.specialization.findUnique({
      where: { id }
    });

    if (!specialization) {
      return res.status(404).json({
        success: false,
        error: 'Specialization not found'
      });
    }

    // Check if doctors are using this specialization
    const doctorsUsingSpecialization = await prisma.user.count({
      where: {
        role: 'DOCTOR',
        specialization: specialization.name
      }
    });

    if (doctorsUsingSpecialization > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete specialization. ${doctorsUsingSpecialization} doctors are using it.`
      });
    }

    // Soft delete by setting isActive to false
    await prisma.specialization.update({
      where: { id },
      data: { isActive: false }
    });

    res.json({
      success: true,
      message: 'Specialization deleted successfully'
    });
  } catch (error) {
    console.error('Delete specialization error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete specialization'
    });
  }
});

export default router;
