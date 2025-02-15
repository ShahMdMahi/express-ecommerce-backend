export interface BkashCreatePaymentResponse {
  paymentID: string;
  createTime: string;
  orgLogo: string;
  orgName: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
}

export interface BkashExecutePaymentResponse {
  paymentID: string;
  createTime: string;
  updateTime: string;
  trxID: string;
  transactionStatus: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
}

export interface BkashQueryPaymentResponse {
  paymentID: string;
  mode: string;
  paymentCreateTime: string;
  amount: string;
  currency: string;
  intent: string;
  merchantInvoiceNumber: string;
  transactionStatus: string;
  verificationStatus: string;
}

export interface BkashPaymentCreateRequest {
  amount: string;
  orderID: string;
  intent: string;
  currency: string;
  merchantInvoiceNumber: string;
}
