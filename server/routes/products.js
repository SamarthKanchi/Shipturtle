import { Router } from 'express';
import Product from '../models/Product.js';
import { protect } from '../middleware/auth.js';

const router = Router();

// @route   GET /api/products
// @desc    Get all products with filtering
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const {
      page = 1, limit = 20, status, syncStatus,
      category, vendorId, search, sort = '-createdAt'
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (syncStatus) query.syncStatus = syncStatus;
    if (category) query.category = category;
    if (vendorId) query.vendorId = vendorId;
    if (search) {
      query.$text = { $search: search };
    }

    const products = await Product.find(query)
      .populate('vendorId', 'businessName')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
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

// @route   GET /api/products/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('vendorId', 'businessName');
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/products
router.post('/', protect, async (req, res, next) => {
  try {
    const product = await Product.create(req.body);
    res.status(201).json({ product });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/products/:id
router.patch('/:id', protect, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ product });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/products/:id
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/products/bulk-import
router.post('/bulk-import', protect, async (req, res, next) => {
  try {
    const { products } = req.body;
    if (!products?.length) {
      return res.status(400).json({ error: 'No products provided' });
    }
    const result = await Product.insertMany(products, { ordered: false });
    res.status(201).json({ imported: result.length, message: `${result.length} products imported` });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/products/sync-status
router.get('/sync/status', protect, async (req, res, next) => {
  try {
    const counts = await Product.aggregate([
      { $group: { _id: '$syncStatus', count: { $sum: 1 } } },
    ]);
    const statusMap = {};
    counts.forEach(c => { statusMap[c._id] = c.count; });
    res.json({ syncStatus: statusMap });
  } catch (error) {
    next(error);
  }
});

export default router;
