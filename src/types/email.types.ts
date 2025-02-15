import { IUser } from '../models/user.model';
import { IOrderItem } from './order.types';

export interface EmailTemplate {
  name: string;
  subject: string;
  content: string;
}

export interface OrderEmailContext {
  orderId: string;
  items: IOrderItem[];
  total: number;
  user: IUser;
}
