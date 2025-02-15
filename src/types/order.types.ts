import { Types } from 'mongoose';

// Change from type to enum
export enum OrderStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled',
    REFUNDED = 'refunded'
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    REFUNDED = 'refunded'
}

export interface PaymentDetails {
    method: string;
    status: PaymentStatus;
    transactionId?: string;
    executeTime?: Date;
}

export interface IOrderItem {
    product: string;
    quantity: number;
    price: number;
    name: string;
}

export interface IShippingDetails {
    address: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
    phone: string;
    trackingNumber?: string;
    carrier?: string;
}

export interface IOrderBase {
    user: Types.ObjectId;
    items: IOrderItem[];
    total: number;
    subTotal: number;
    tax: number;
    shipping: {
        cost: number;
        details: IShippingDetails;
    };
    status: OrderStatus;
    payment: PaymentDetails;
    notes?: string;
}

export interface IExtendedOrder extends IOrderBase {
    _id: Types.ObjectId;
    id: string;  // virtual property
    createdAt: Date;
    updatedAt: Date;
}

export type CreateOrderDTO = Omit<IOrderBase, 'status' | 'payment'> & {
    paymentMethod: string;
};

export type UpdateOrderDTO = Partial<IOrderBase>;
