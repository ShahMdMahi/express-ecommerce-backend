import mongoose, { Document } from 'mongoose';

export interface IAddress {
  user: mongoose.Types.ObjectId;
  type: 'shipping' | 'billing';
  isDefault: boolean;
  firstName: string;
  lastName: string;
  street: string;
  apartment?: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  phone: string;
  instructions?: string;
}

export interface IAddressDocument extends IAddress, Document {
  createdAt: Date;
  updatedAt: Date;
}

const addressSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['shipping', 'billing'], required: true },
  isDefault: { type: Boolean, default: false },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  street: { type: String, required: true },
  apartment: String,
  city: { type: String, required: true },
  state: { type: String, required: true },
  country: { type: String, required: true },
  zipCode: { type: String, required: true },
  phone: { type: String, required: true },
  instructions: String
}, {
  timestamps: true
});

addressSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.model('Address').updateMany(
      { user: this.user, type: this.type, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

export const Address = mongoose.model<IAddressDocument>('Address', addressSchema);
