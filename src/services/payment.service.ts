import Bkash from "bkash-payment-gateway";
import { bkashConfig } from "../config/bkash.config";
import {
  BkashCreatePaymentResponse,
  BkashExecutePaymentResponse,
  BkashQueryPaymentResponse,
  BkashPaymentCreateRequest,
} from "../types/bkash.types";

// Define the BkashGateway type based on the instance methods we're using
interface BkashGateway {
  createPayment(
    request: BkashPaymentCreateRequest
  ): Promise<BkashCreatePaymentResponse>;
  executePayment(paymentID: string): Promise<BkashExecutePaymentResponse>;
  queryPayment(paymentID: string): Promise<BkashQueryPaymentResponse>;
}

export class PaymentService {
  private static bkashInstance: BkashGateway | null = null;
  private static isDevelopment = process.env.NODE_ENV !== "production";

  private static getBkashInstance(): BkashGateway {
    if (!this.bkashInstance) {
      try {
        this.bkashInstance = new (Bkash as any)(bkashConfig);

        // Log warning in development mode
        if (this.isDevelopment) {
          console.warn("Using bKash sandbox environment");
        }
      } catch (error) {
        console.error("Failed to initialize bKash:", error);
        throw new Error("bKash initialization failed");
      }
    }

    if (!this.bkashInstance) {
      throw new Error("bKash instance is not properly initialized");
    }

    return this.bkashInstance;
  }

  static async createBkashPayment(
    orderId: string,
    amount: number
  ): Promise<BkashCreatePaymentResponse> {
    try {
      const bkash = this.getBkashInstance();
      const paymentRequest: BkashPaymentCreateRequest = {
        amount: amount.toString(),
        orderID: orderId,
        intent: "sale",
        currency: "BDT",
        merchantInvoiceNumber: `INV-${orderId}`,
      };

      const payment = await bkash.createPayment(paymentRequest);
      return payment;
    } catch (error) {
      console.error("bKash payment creation error:", error);
      throw new Error(
        `bKash payment creation failed: ${(error as Error).message}`
      );
    }
  }

  static async executeBkashPayment(
    paymentID: string
  ): Promise<BkashExecutePaymentResponse> {
    try {
      const bkash = this.getBkashInstance();
      const execution = await bkash.executePayment(paymentID);
      return execution;
    } catch (error) {
      throw new Error(
        `bKash payment execution failed: ${(error as Error).message}`
      );
    }
  }

  static async queryBkashPayment(
    paymentID: string
  ): Promise<BkashQueryPaymentResponse> {
    try {
      const bkash = this.getBkashInstance();
      const status = await bkash.queryPayment(paymentID);
      return status;
    } catch (error) {
      throw new Error(
        `bKash payment query failed: ${(error as Error).message}`
      );
    }
  }
}
