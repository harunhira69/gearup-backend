export interface CreatePaymentPayload {
  rentalOrderId: string;
}

export interface ConfirmPaymentPayload {
  paymentId?: string;
  sessionId?: string;
}