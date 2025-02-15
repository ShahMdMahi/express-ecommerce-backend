import { Request, Response } from 'express';
import { Order, IOrderDocument } from '../models/order.model';
import { Product } from '../models/product.model';
import mongoose from 'mongoose';
import { EmailService } from '../services/email.service';
import { AnalyticsService } from '../services/analytics.service';

export const createOrder = async (req: Request, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { items, shippingAddress, paymentMethod } = req.body;
    
    // Validate stock and calculate totals
    let totalAmount = 0;
    const stockUpdates = [];

    for (const item of items) {
      const product = await Product.findById(item.product);
      if (!product || product.stock.quantity < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.product}`);
      }
      totalAmount += item.quantity * item.price;
      stockUpdates.push({
        updateOne: {
          filter: { _id: item.product },
          update: { $inc: { 'stock.quantity': -item.quantity } }
        }
      });
    }

    const shippingCost = 10; // Calculate based on address and weight
    const tax = totalAmount * 0.1; // Calculate based on region

    const order: IOrderDocument = (await Order.create([{
      user: req.user._id,
      items,
      shippingAddress,
      paymentMethod,
      totalAmount,
      shippingCost,
      tax,
      status: 'pending',
      paymentStatus: 'pending'
    }], { session }))[0];

    await Product.bulkWrite(stockUpdates, { session });

    // Send order confirmation email
    await EmailService.sendOrderConfirmation(order, req.user);

    // Track purchase event
    await AnalyticsService.trackEvent(
      AnalyticsService.formatPurchaseEvent(order, req.user._id.toString())
    );

    await session.commitTransaction();
    res.status(201).json(order);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: (error as Error).message });
  } finally {
    session.endSession();
  }
};

export const getOrders = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('items.product', 'name images');

    const total = await Order.countDocuments({ user: req.user._id });

    res.json({
      orders,
      page,
      pages: Math.ceil(total / limit),
      total
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch orders' });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name images price')
      .populate('user', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user is authorized to view this order
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch order' });
  }
};

export const updateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update order status' });
  }
};

export const beginCheckout = async (req: Request, res: Response) => {
  try {
    const { items, value } = req.body;
    
    await AnalyticsService.trackEvent({
      name: 'begin_checkout',
      params: {
        currency: 'USD',
        value,
        items: items.map((item: any) => ({
          item_id: item.product,
          item_name: item.name,
          price: item.price,
          quantity: item.quantity,
          currency: 'USD'
        }))
      },
      user_id: req.user._id.toString(),
      timestamp: Date.now()
    });

    res.status(200).json({ message: 'Checkout started' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to start checkout' });
  }
};
