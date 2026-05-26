import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Vendor from '../models/Vendor.js';

const router = Router();

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama-3.3-70b-versatile';

/**
 * Build a system prompt containing the full product catalog
 * so the LLM can answer questions grounded in real data.
 */
async function buildSystemPrompt() {
  const [products, vendors, orderStats] = await Promise.all([
    Product.find({}).populate('vendorId', 'businessName').lean(),
    Vendor.find({}).select('businessName status').lean(),
    Order.aggregate([
      { $group: { _id: null, totalOrders: { $sum: 1 }, totalRevenue: { $sum: '$financials.total' } } },
    ]),
  ]);

  const productSummaries = products.map((p) => ({
    title: p.title,
    sku: p.sku || 'N/A',
    category: p.category,
    price: p.price,
    compareAtPrice: p.compareAtPrice || null,
    inventoryQuantity: p.inventoryQuantity,
    status: p.status,
    syncStatus: p.syncStatus,
    vendor: p.vendorId?.businessName || 'Unknown',
    variants: (p.variants || []).map((v) => ({
      title: v.title,
      sku: v.sku,
      price: v.price,
      inventoryQuantity: v.inventoryQuantity,
    })),
    tags: p.tags || [],
  }));

  const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0 };

  return `You are SyncFlow AI Assistant — a helpful, knowledgeable assistant for the SyncFlow multi-vendor marketplace platform.

You have access to the following real-time data from the store:

## Product Catalog (${productSummaries.length} products)
${JSON.stringify(productSummaries, null, 2)}

## Vendor Summary (${vendors.length} vendors)
${JSON.stringify(vendors.map((v) => ({ name: v.businessName, status: v.status })), null, 2)}

## Store Overview
- Total Orders: ${stats.totalOrders}
- Total Revenue: ₹${stats.totalRevenue.toFixed(2)}

## Your Instructions
- Answer questions about products, inventory quantities, pricing, categories, vendors, and orders.
- Always use ₹ (Indian Rupee) when displaying prices or monetary values.
- When asked about stock/inventory, reference the inventoryQuantity field.
- When asked about low stock, flag products with inventoryQuantity < 10.
- Be concise but thorough. Use bullet points and formatting when helpful.
- If you don't know something or the data doesn't cover it, say so honestly.
- Be friendly and professional. You represent SyncFlow AI.
- Do NOT make up product data that isn't in the catalog above.
- When relevant, suggest follow-up questions the user might find useful.`;
}

// POST /api/chat
router.post('/', protect, async (req, res) => {
  try {
    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const apiKey = process.env.groq_api_key;
    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key is not configured' });
    }

    // Build system prompt with fresh product data
    const systemPrompt = await buildSystemPrompt();

    // Build messages array: system + history + current message
    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      })),
      { role: 'user', content: message.trim() },
    ];

    // Call Groq API
    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        top_p: 1,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error('Groq API error:', response.status, errBody);
      return res.status(502).json({ error: 'Failed to get response from AI service' });
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';

    res.json({
      reply: aiMessage,
      usage: data.usage || null,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
