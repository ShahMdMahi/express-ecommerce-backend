import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { User, IUserDocument } from "../models/user.model";
import mongoose from 'mongoose';
import { EmailService } from '../services/email.service';

const generateToken = (id: mongoose.Types.ObjectId) => {
  return jwt.sign({ id: id.toString() }, process.env.JWT_SECRET!, {
    expiresIn: "30d",
  });
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const user: IUserDocument = await User.create({
      email,
      password,
      firstName,
      lastName,
    });

    // Send welcome email
    await EmailService.sendWelcomeEmail(user);

    res.status(201).json({
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(400).json({ message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user: IUserDocument | null = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(400).json({ message: "Invalid credentials" });
  }
};
