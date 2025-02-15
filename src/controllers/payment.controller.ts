import { Request, Response } from 'express';
import { PaymentService } from '../services/payment.service';
import { Order } from '../models/order.model';
import mongoose from 'mongoose';

export const initiateBkashPayment = async (req: Request, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'Order already paid' });
    }

    const payment = await PaymentService.createBkashPayment(
      orderId,
      order.totalAmount
    );

    await Order.findByIdAndUpdate(orderId, {
      $set: {
        'payment.provider': 'bkash',
        'payment.paymentId': payment.paymentID,
        'payment.createTime': payment.createTime
      }
    });

    res.json(payment);
  } catch (error) {
    console.error('bKash payment initiation error:', error);
    res.status(400).json({ message: (error as Error).message });
  }
};

export const executeBkashPayment = async (req: Request, res: Response) => {
  try {
    const { paymentID } = req.body;
    const execution = await PaymentService.executeBkashPayment(paymentID);

    const order = await Order.findOne({ 'payment.paymentId': paymentID });
    if (!order) {
      throw new Error('Order not found');
    }

    if (execution.transactionStatus === 'Completed') {
      order.paymentStatus = 'paid';
      order.payment = {
        ...order.payment,
        trxID: execution.trxID,
        executeTime: execution.updateTime, // Changed from executeTime to updateTime
        transactionStatus: execution.transactionStatus
      };
      await order.save();
    }

    res.json(execution);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const queryBkashPayment = async (req: Request, res: Response) => {
  try {
    const { paymentID } = req.params;
    const status = await PaymentService.queryBkashPayment(paymentID);
    res.json(status);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};
