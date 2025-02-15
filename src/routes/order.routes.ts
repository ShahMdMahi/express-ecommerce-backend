import express from "express";
import { protect, admin } from "../middleware/auth.middleware";
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller";

const router = express.Router();

router.route("/").post(protect, createOrder).get(protect, getOrders);

router.route("/:id").get(protect, getOrderById);

router.route("/:id/status").put(protect, admin, updateOrderStatus);

export default router;
