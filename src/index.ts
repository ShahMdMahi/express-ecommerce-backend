import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.config";
import authRoutes from "./routes/auth.routes";
import productRoutes from "./routes/product.routes";
import { validateApiKey } from "./middleware/apiKey.middleware";
import { connectRedis } from "./config/redis.config";
import categoryRoutes from "./routes/category.routes";
import orderRoutes from "./routes/order.routes";
import reviewRoutes from "./routes/review.routes";
import uploadRoutes from "./routes/upload.routes";
import profileRoutes from "./routes/profile.routes";
import paymentRoutes from "./routes/payment.routes";
import wishlistRoutes from "./routes/wishlist.routes";
import searchRoutes from "./routes/search.routes";
import analyticsRoutes from "./routes/analytics.routes";
import { trackPageView } from "./middleware/analytics.middleware";

dotenv.config();

const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use("/api", validateApiKey);
app.use(trackPageView);

// Connect to Database
connectDB();

// Connect to Redis
connectRedis().catch(console.error);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/wishlist", wishlistRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/analytics", analyticsRoutes);

// Basic route
app.get("/", (req, res) => {
  res.send("API is running...");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

export default app;
