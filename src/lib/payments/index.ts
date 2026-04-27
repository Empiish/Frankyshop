// Auto-select the live payment provider.
// MPESA_TZ_API_KEY present → real Vodacom; otherwise → mock.

import type { PaymentProvider } from "./types";
import { mockProvider } from "./mock";
import { mpesaTzProvider } from "./mpesa-tz";

export function getPaymentProvider(): PaymentProvider {
  if (
    process.env.MPESA_TZ_API_KEY &&
    process.env.MPESA_TZ_PUBLIC_KEY &&
    process.env.MPESA_TZ_BUSINESS_SHORTCODE
  ) {
    return mpesaTzProvider;
  }
  return mockProvider;
}

export type { PaymentProvider, InitiatePaymentInput, InitiatePaymentResult } from "./types";
