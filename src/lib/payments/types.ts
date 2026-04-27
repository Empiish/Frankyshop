// Provider-agnostic payment interface.
// Live providers: mock (default in dev) and Vodacom M-Pesa Tanzania.

export type InitiatePaymentInput = {
  orderId: string;
  orderCode: string;
  amountTsh: number;
  customerPhone: string;
  customerName: string;
};

export type InitiatePaymentResult =
  | { ok: true; provider: string; transactionRef: string }
  | { ok: false; provider: string; error: string };

export interface PaymentProvider {
  readonly name: string;
  initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult>;
}
