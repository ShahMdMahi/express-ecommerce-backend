import mongoose, { Document } from 'mongoose';

export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  variant?: string;
  quantity: number;
  price: number;
}

// Base interface without _id
export interface IOrderBase {
  user: mongoose.Types.ObjectId;
  items: IOrderItem[];
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  payment: {
    provider?: 'bkash' | 'cod' | 'card';
    paymentId?: string;
    trxID?: string;
    createTime?: string;
    executeTime?: string;
    transactionStatus?: string;
  };
  paymentMethod: 'credit_card' | 'paypal' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  totalAmount: number;
  shippingCost: number;
  tax: number;
  notes?: string;
}

// Interface for regular usage with optional _id
export interface IOrder extends IOrderBase {
  _id?: mongoose.Types.ObjectId;
}

// Interface for documents from MongoDB
export interface IOrderDocument extends IOrderBase, Document {
  createdAt: Date;
  updatedAt: Date;
}

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: String,
    quantity: { type: Number, required: true },
    price: { type: Number, required: true }
  }],
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, required: true },
    zipCode: { type: String, required: true }
  },
  payment: {
    provider: { type: String, enum: ['bkash', 'cod', 'card'] },
    paymentId: String,
    trxID: String,
    createTime: String,
    executeTime: String,
    transactionStatus: String
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'cod'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  totalAmount: { type: Number, required: true },
  shippingCost: { type: Number, required: true },
  tax: { type: Number, required: true },
  notes: String
}, {
  timestamps: true
});

export const Order = mongoose.model<IOrderDocument>('Order', orderSchema);
