import mongoose, { Document, Schema } from 'mongoose';
import { IOrderBase, OrderStatus, PaymentStatus } from '../types/order.types';

export interface IOrder extends IOrderBase {
    createdAt: Date;
    updatedAt: Date;
    totalAmount: number;
    shippingCost: number;
    paymentMethod: string;
    paymentStatus: string;
}

export interface IOrderDocument extends IOrder, Document {}

const orderItemSchema = new Schema({
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: String,
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true },
    name: { type: String, required: true }
});

const shippingDetailsSchema = new Schema({
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true },
    phone: { type: String, required: true },
    trackingNumber: String,
    carrier: String
});

const orderSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: [orderItemSchema],
    totalAmount: { type: Number, required: true },
    subTotal: { type: Number, required: true },
    tax: { type: Number, required: true },
    shippingCost: { type: Number, required: true },
    shipping: {
        cost: { type: Number, required: true },
        details: shippingDetailsSchema
    },
    status: {
        type: String,
        enum: Object.values(OrderStatus),
        default: OrderStatus.PENDING
    },
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, default: 'pending' },
    payment: {
        method: { type: String, required: true },
        status: {
            type: String,
            enum: Object.values(PaymentStatus),
            default: PaymentStatus.PENDING
        },
        transactionId: String,
        trxID: String,
        executeTime: Date
    },
    notes: String
}, {
    timestamps: true
});

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ createdAt: 1 });

export const Order = mongoose.model<IOrderDocument>('Order', orderSchema);
