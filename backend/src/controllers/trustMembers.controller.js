import fs from 'fs';
import path from 'path';
import prisma from '../config/db.js';

function saveTrustMemberImage(dataUri, name = 'mentor') {
  if (!dataUri || typeof dataUri !== 'string') return null;

  // Already a static path or remote URL
  if (
    dataUri.startsWith('http://') ||
    dataUri.startsWith('https://') ||
    dataUri.startsWith('/uploads/') ||
    dataUri.startsWith('/pdf-extracted/')
  ) {
    return dataUri;
  }

  // Base64 Data URL
  const matches = dataUri.match(/^data:image\/([a-zA-Z0-9+]+);base64,(.+)$/);
  if (!matches) {
    return dataUri;
  }

  try {
    const ext = matches[1].toLowerCase().replace('jpeg', 'jpg');
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadsDir = path.join(process.cwd(), 'uploads', 'trust-members');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const cleanName = (name || 'member')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30) || 'member';

    const filename = `${cleanName}-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;
    const filePath = path.join(uploadsDir, filename);

    fs.writeFileSync(filePath, buffer);
    return `/uploads/trust-members/${filename}`;
  } catch (err) {
    console.error('Error saving base64 trust member image:', err);
    return '/pdf-extracted/img_4_26483.jpg';
  }
}

export class TrustMembersController {
  /**
   * List all trust members/mentors for Admin
   */
  static async listTrustMembersAdmin(req, res, next) {
    try {
      const { search } = req.query;
      const where = {};

      if (search && search.trim()) {
        const q = search.trim();
        where.OR = [
          { name: { contains: q, mode: 'insensitive' } },
          { specialization: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { tag: { contains: q, mode: 'insensitive' } },
        ];
      }

      const members = await prisma.trustMember.findMany({
        where,
        orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
      });

      res.status(200).json({
        success: true,
        data: members,
        total: members.length,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Create a new trust member / mentor
   */
  static async createTrustMember(req, res, next) {
    try {
      const {
        name,
        specialization,
        description,
        image,
        tag,
        badgeColor,
        linkedinUrl,
        twitterUrl,
        githubUrl,
        displayOrder,
        isActive,
      } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'Trust member name is required.' });
      }
      if (!specialization || !specialization.trim()) {
        return res.status(400).json({ success: false, message: 'Specialization is required.' });
      }
      if (!description || !description.trim()) {
        return res.status(400).json({ success: false, message: 'Description/Bio is required.' });
      }

      let finalImage = '/pdf-extracted/img_4_26483.jpg';
      if (image && image.trim()) {
        finalImage = saveTrustMemberImage(image.trim(), name);
      }

      const member = await prisma.trustMember.create({
        data: {
          name: name.trim(),
          specialization: specialization.trim(),
          description: description.trim(),
          image: finalImage,
          tag: tag && tag.trim() ? tag.trim() : 'Academic Leader',
          badgeColor: badgeColor && badgeColor.trim() ? badgeColor.trim() : 'bg-[#FFB52E] text-[#172033]',
          linkedinUrl: linkedinUrl ? linkedinUrl.trim() : null,
          twitterUrl: twitterUrl ? twitterUrl.trim() : null,
          githubUrl: githubUrl ? githubUrl.trim() : null,
          displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0,
          isActive: isActive !== undefined ? Boolean(isActive) : true,
        },
      });

      if (req.user?.id) {
        await prisma.auditLog.create({
          data: {
            actorId: req.user.id,
            action: 'CREATE_TRUST_MEMBER',
            entityType: 'TrustMember',
            entityId: member.id,
            newState: member,
          }
        }).catch(() => null);
      }

      res.status(201).json({
        success: true,
        message: 'Trust member created successfully and published to homepage.',
        data: member,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single trust member by ID
   */
  static async getTrustMemberById(req, res, next) {
    try {
      const { id } = req.params;
      const member = await prisma.trustMember.findUnique({
        where: { id },
      });

      if (!member) {
        return res.status(404).json({ success: false, message: 'Trust member not found.' });
      }

      res.status(200).json({ success: true, data: member });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Update trust member
   */
  static async updateTrustMember(req, res, next) {
    try {
      const { id } = req.params;
      const {
        name,
        specialization,
        description,
        image,
        tag,
        badgeColor,
        linkedinUrl,
        twitterUrl,
        githubUrl,
        displayOrder,
        isActive,
      } = req.body;

      const existing = await prisma.trustMember.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Trust member not found.' });
      }

      let finalImage = existing.image;
      if (image !== undefined) {
        if (image && image.trim()) {
          finalImage = saveTrustMemberImage(image.trim(), name || existing.name);
        } else {
          finalImage = '/pdf-extracted/img_4_26483.jpg';
        }
      }

      const updated = await prisma.trustMember.update({
        where: { id },
        data: {
          name: name !== undefined ? name.trim() : existing.name,
          specialization: specialization !== undefined ? specialization.trim() : existing.specialization,
          description: description !== undefined ? description.trim() : existing.description,
          image: finalImage,
          tag: tag !== undefined ? tag.trim() : existing.tag,
          badgeColor: badgeColor !== undefined ? badgeColor.trim() : existing.badgeColor,
          linkedinUrl: linkedinUrl !== undefined ? (linkedinUrl ? linkedinUrl.trim() : null) : existing.linkedinUrl,
          twitterUrl: twitterUrl !== undefined ? (twitterUrl ? twitterUrl.trim() : null) : existing.twitterUrl,
          githubUrl: githubUrl !== undefined ? (githubUrl ? githubUrl.trim() : null) : existing.githubUrl,
          displayOrder: displayOrder !== undefined ? Number(displayOrder) : existing.displayOrder,
          isActive: isActive !== undefined ? Boolean(isActive) : existing.isActive,
        },
      });

      if (req.user?.id) {
        await prisma.auditLog.create({
          data: {
            actorId: req.user.id,
            action: 'UPDATE_TRUST_MEMBER',
            entityType: 'TrustMember',
            entityId: id,
            previousState: existing,
            newState: updated,
          }
        }).catch(() => null);
      }

      res.status(200).json({
        success: true,
        message: 'Trust member updated successfully.',
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete trust member
   */
  static async deleteTrustMember(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await prisma.trustMember.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Trust member not found.' });
      }

      await prisma.trustMember.delete({ where: { id } });

      if (req.user?.id) {
        await prisma.auditLog.create({
          data: {
            actorId: req.user.id,
            action: 'DELETE_TRUST_MEMBER',
            entityType: 'TrustMember',
            entityId: id,
            previousState: existing,
          }
        }).catch(() => null);
      }

      res.status(200).json({
        success: true,
        message: 'Trust member deleted successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Toggle Active Status
   */
  static async toggleStatus(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await prisma.trustMember.findUnique({ where: { id } });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Trust member not found.' });
      }

      const updated = await prisma.trustMember.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });

      res.status(200).json({
        success: true,
        message: `Trust member marked as ${updated.isActive ? 'Active' : 'Inactive'}.`,
        data: updated,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Upload Image File (Base64)
   */
  static async uploadImage(req, res, next) {
    try {
      const { image, name } = req.body;
      if (!image) {
        return res.status(400).json({ success: false, message: 'Image data is required.' });
      }

      const savedUrl = saveTrustMemberImage(image, name);
      res.status(200).json({
        success: true,
        message: 'Image uploaded successfully.',
        url: savedUrl,
      });
    } catch (err) {
      next(err);
    }
  }
}
