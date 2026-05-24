import { Router } from 'express';
import Vendor from '../models/Vendor.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// @route   GET /api/vendors
// @desc    Get all vendors (with pagination & filters)
// @access  Private (marketplace_owner, super_admin)
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, sort = '-createdAt' } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { businessEmail: { $regex: search, $options: 'i' } },
      ];
    }

    const vendors = await Vendor.find(query)
      .populate('userId', 'name email avatar')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Vendor.countDocuments(query);

    res.json({
      vendors,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/vendors/:id
// @desc    Get vendor by ID
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id).populate('userId', 'name email avatar');
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json({ vendor });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/vendors
// @desc    Create a new vendor
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const vendor = await Vendor.create({
      userId: req.user._id,
      ...req.body,
    });
    res.status(201).json({ vendor });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/vendors/:id
// @desc    Update vendor
// @access  Private
router.patch('/:id', protect, async (req, res, next) => {
  try {
    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json({ vendor });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/vendors/:id/status
// @desc    Update vendor status (approve, suspend, reject)
// @access  Private (marketplace_owner, super_admin)
router.patch('/:id/status', protect, authorize('marketplace_owner', 'super_admin'), async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['pending', 'approved', 'suspended', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const vendor = await Vendor.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json({ vendor });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/vendors/:id/performance
// @desc    Get vendor performance metrics
// @access  Private
router.get('/:id/performance', protect, async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id).select('performance businessName');
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    res.json({ performance: vendor.performance, businessName: vendor.businessName });
  } catch (error) {
    next(error);
  }
});

export default router;
