export type PaymentRequest = {
  amount: number;
  currency?: string;
  patientId?: string;
  hospitalId: string;
  encounterId?: string;
};

export type PaymentResult = {
  provider: string;
  transactionId: string;
  status: "MOCK" | "COMPLETED" | "FAILED" | "PENDING";
  amount: number;
};

export interface PaymentProvider {
  charge(request: PaymentRequest): Promise<PaymentResult>;
}

export class MockPaymentProvider implements PaymentProvider {
  async charge(request: PaymentRequest): Promise<PaymentResult> {
    return {
      provider: "MOCK",
      transactionId: `MOCK-${Date.now()}`,
      status: "MOCK",
      amount: request.amount,
    };
  }
}

export function getPaymentProvider(): PaymentProvider {
  return new MockPaymentProvider();
}
