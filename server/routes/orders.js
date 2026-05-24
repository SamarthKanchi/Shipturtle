import { Router } from 'express';
import Order from '../models/Order.js';
import { protect, authorize } from '../middleware/auth.js';

const router = Router();

// Helper to generate order number
const generateOrderNumber = () => {
  const prefix = 'SF';
  const num = Math.floor(1000 + Math.random() * 9000);
  return `#${prefix}-${num}`;
};

// @route   GET /api/orders
// @desc    Get all orders with filtering
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, vendorId, search, sort = '-createdAt' } = req.query;

    const query = {};
    if (status) query.status = status;
    if (vendorId) query['lineItems.vendorId'] = vendorId;
    if (search) {
      query.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.email': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .populate('lineItems.vendorId', 'businessName')
      .populate('lineItems.productId', 'title sku')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(query);

    res.json({
      orders,
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

// @route   GET /api/orders/:id
router.get('/:id', protect, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('lineItems.vendorId', 'businessName')
      .populate('lineItems.productId', 'title sku images');
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/orders
router.post('/', protect, async (req, res, next) => {
  try {
    const order = await Order.create({
      ...req.body,
      orderNumber: req.body.orderNumber || generateOrderNumber(),
    });
    res.status(201).json({ order });
  } catch (error) {
    next(error);
  }
});

// @route   PATCH /api/orders/:id/status
router.patch('/:id/status', protect, async (req, res, next) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'partially_fulfilled', 'fulfilled', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/orders/:id/fulfill
router.post('/:id/fulfill', protect, async (req, res, next) => {
  try {
    const { vendorId, trackingNumber, carrier } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.fulfillments.push({
      vendorId,
      trackingNumber,
      carrier,
      status: 'shipped',
      shippedAt: new Date(),
    });

    // Update line items for this vendor
    order.lineItems.forEach(item => {
      if (item.vendorId?.toString() === vendorId) {
        item.fulfillmentStatus = 'fulfilled';
      }
    });

    // Check if all items are fulfilled
    const allFulfilled = order.lineItems.every(i => i.fulfillmentStatus === 'fulfilled');
    order.status = allFulfilled ? 'fulfilled' : 'partially_fulfilled';

    await order.save();
    res.json({ order });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/analytics/summary
router.get('/analytics/summary', protect, async (req, res, next) => {
  try {
    const [statusCounts, revenueTotal] = await Promise.all([
      Order.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$financials.total' }, count: { $sum: 1 } } },
      ]),
    ]);

    res.json({
      statusBreakdown: statusCounts,
      revenue: revenueTotal[0] || { total: 0, count: 0 },
    });
  } catch (error) {
    next(error);
  }
});
// @route   GET /api/orders/analytics/monthly
// @desc    Aggregate orders by month for the current year
// @access  Private
router.get('/analytics/monthly', protect, async (req, res, next) => {
  try {
    const year = new Date().getFullYear();
    const result = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${year}-01-01`),
            $lt: new Date(`${year + 1}-01-01`),
          },
          status: { $ne: 'cancelled' },
        },
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          revenue: { $sum: '$financials.total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthly = monthNames.map((name, i) => {
      const found = result.find(r => r._id === i + 1);
      return {
        name,
        revenue: found ? Math.round(found.revenue * 100) / 100 : 0,
        orders: found ? found.orders : 0,
      };
    });

    res.json({ monthly });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/analytics/vendors
// @desc    Aggregate revenue + order count per vendor (top 5)
// @access  Private
router.get('/analytics/vendors', protect, async (req, res, next) => {
  try {
    const result = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $unwind: '$lineItems' },
      {
        $group: {
          _id: '$lineItems.vendorId',
          revenue: { $sum: { $multiply: ['$lineItems.price', '$lineItems.quantity'] } },
          orders: { $sum: 1 },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: 'vendors',
          localField: '_id',
          foreignField: '_id',
          as: 'vendor',
        },
      },
      { $unwind: { path: '$vendor', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          name: { $ifNull: ['$vendor.businessName', 'Unknown Vendor'] },
          revenue: { $round: ['$revenue', 2] },
          orders: 1,
        },
      },
    ]);

    res.json({ vendors: result });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/orders/analytics/fulfillment
// @desc    Group orders by status, return percentage breakdown
// @access  Private
router.get('/analytics/fulfillment', protect, async (req, res, next) => {
  try {
    const result = await Order.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = result.reduce((sum, r) => sum + r.count, 0);
    const colorMap = {
      pending: '#F59E0B',
      processing: '#3B82F6',
      partially_fulfilled: '#8B5CF6',
      fulfilled: '#10B981',
      cancelled: '#EF4444',
      refunded: '#71717A',
    };
    const labelMap = {
      pending: 'Pending',
      processing: 'Processing',
      partially_fulfilled: 'Partial',
      fulfilled: 'Fulfilled',
      cancelled: 'Cancelled',
      refunded: 'Refunded',
    };

    const fulfillment = result.map(r => ({
      name: labelMap[r._id] || r._id,
      value: total > 0 ? Math.round((r.count / total) * 100) : 0,
      count: r.count,
      color: colorMap[r._id] || '#71717A',
    }));

    res.json({ fulfillment });
  } catch (error) {
    next(error);
  }
});

export default router;
