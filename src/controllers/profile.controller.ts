import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { Address } from '../models/address.model';
import { ImageService } from '../services/image.service';
import { UploadedFile } from 'express-fileupload';

export const getProfile = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.email;
    delete updates.role;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: 'Error updating profile' });
  }
};

export const updateAvatar = async (req: Request, res: Response) => {
  try {
    if (!req.files?.avatar) {
      throw new Error('No avatar image provided');
    }
    const avatar = Array.isArray(req.files.avatar) ? req.files.avatar[0] : req.files.avatar;
    const url = await ImageService.uploadSingle(avatar, 'avatars');

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { avatar: url },
      { new: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const updateProfilePicture = async (req: Request, res: Response) => {
  try {
    if (!req.files?.image) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const image = req.files.image as UploadedFile;
    const url = await ImageService.uploadSingle(image, `users/${req.user._id}/profile`);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { avatar: url } },
      { new: true }
    );

    res.json({ url, user });
  } catch (error) {
    res.status(500).json({ message: (error as Error).message });
  }
};

export const addAddress = async (req: Request, res: Response) => {
  try {
    const address = await Address.create({
      ...req.body,
      user: req.user._id
    });
    res.status(201).json(address);
  } catch (error) {
    res.status(400).json({ message: 'Error adding address' });
  }
};

export const getAddresses = async (req: Request, res: Response) => {
  try {
    const addresses = await Address.find({ user: req.user._id });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching addresses' });
  }
};

export const updateAddress = async (req: Request, res: Response) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true }
    );
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    res.json(address);
  } catch (error) {
    res.status(400).json({ message: 'Error updating address' });
  }
};

export const deleteAddress = async (req: Request, res: Response) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id
    });
    if (!address) {
      return res.status(404).json({ message: 'Address not found' });
    }
    res.json({ message: 'Address deleted' });
  } catch (error) {
    res.status(400).json({ message: 'Error deleting address' });
  }
};
