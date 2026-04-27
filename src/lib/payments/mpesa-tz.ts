// Vodacom M-Pesa Tanzania (Open API) C2B Single-Stage payment.
// Docs: https://openapiportal.m-pesa.com/api-documentation
//
// Flow:
//   1) Encrypt the static API_KEY with the public RSA key Vodacom provides.
//      That ciphertext is the Bearer token used for /getSession.
//   2) POST /getSession → response.output_SessionID.
//   3) Encrypt the session id (same RSA scheme). That's the bearer for
//      the actual payment call.
//   4) POST /c2bPayment/singleStage with the order details. The call blocks
//      until the customer accepts the STK push on their phone (≈30–90s)
//      or it times out. Response holds the final status.
//
// Untested in this codebase — runs only when env vars are set.

import { publicEncrypt, constants } from "node:crypto";
import { sql } from "@/lib/db";
import type {
  PaymentProvider,
  InitiatePaymentInput,
  InitiatePaymentResult,
} from "./types";

const SANDBOX = "https://openapi.m-pesa.com/sandbox";
const LIVE = "https://openapi.m-pesa.com/openapi";

function baseUrl(): string {
  return process.env.MPESA_TZ_ENV === "production" ? LIVE : SANDBOX;
}

function bearerFromKey(secret: string): string {
  const pubKey = process.env.MPESA_TZ_PUBLIC_KEY;
  if (!pubKey) throw new Error("MPESA_TZ_PUBLIC_KEY not set");
  // Vodacom's pub key from the portal is base64 of the DER. Wrap as PEM.
  const pem =
    "-----BEGIN PUBLIC KEY-----\n" +
    pubKey.match(/.{1,64}/g)!.join("\n") +
    "\n-----END PUBLIC KEY-----\n";
  const ciphertext = publicEncrypt(
    { key: pem, padding: constants.RSA_PKCS1_PADDING },
    Buffer.from(secret, "utf8"),
  );
  return ciphertext.toString("base64");
}

async function getSession(): Promise<string> {
  const apiKey = process.env.MPESA_TZ_API_KEY;
  if (!apiKey) throw new Error("MPESA_TZ_API_KEY not set");
  const token = bearerFromKey(apiKey);
  const res = await fetch(`${baseUrl()}/ipg/v2/vodacomTZN/getSession/`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, Origin: "*" },
  });
  if (!res.ok) throw new Error(`Vodacom getSession failed (${res.status})`);
  const json = await res.json();
  const sessionId = json?.output_SessionID as string | undefined;
  if (!sessionId) throw new Error(`Vodacom getSession bad payload: ${JSON.stringify(json)}`);
  return sessionId;
}

export const mpesaTzProvider: PaymentProvider = {
  name: "mpesa-tz",
  async initiate(input: InitiatePaymentInput): Promise<InitiatePaymentResult> {
    try {
      const shortcode = process.env.MPESA_TZ_BUSINESS_SHORTCODE;
      if (!shortcode) throw new Error("MPESA_TZ_BUSINESS_SHORTCODE not set");

      const sessionId = await getSession();
      const sessionToken = bearerFromKey(sessionId);

      const conversionId = `FK-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      // Vodacom expects MSISDN as 12 digits, country code first, no +.
      const msisdn = input.customerPhone.replace(/[^\d]/g, "").replace(/^0/, "255");

      const body = {
        input_TransactionReference: input.orderCode,
        input_CustomerMSISDN: msisdn,
        input_Country: "TZN",
        input_Currency: "TZS",
        input_Amount: String(input.amountTsh),
        input_ServiceProviderCode: shortcode,
        input_ThirdPartyConversionID: conversionId,
        input_PurchasedItemsDesc: `FrankyShop ${input.orderCode}`,
      };

      const res = await fetch(`${baseUrl()}/ipg/v2/vodacomTZN/c2bPayment/singleStage/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${sessionToken}`,
          Origin: "*",
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      const code = String(json?.output_ResponseCode ?? "");
      const txnId = String(json?.output_TransactionID ?? conversionId);

      if (code === "INS-0" || code === "0") {
        // Success — flip the order to paid + award loyalty (mirrors mock provider).
        await sql`
          update orders set
            status = 'paid',
            payment_ref = ${txnId},
            paid_at = coalesce(paid_at, now()),
            updated_at = now()
          where id = ${input.orderId}
        `;
        const [row] = await sql<{ customer_id: string | null; total_tsh: number }[]>`
          select customer_id, total_tsh from orders where id = ${input.orderId}
        `;
        if (row?.customer_id) {
          const points = Math.floor(row.total_tsh / 1000);
          if (points > 0) {
            await sql`update customers set loyalty_points = loyalty_points + ${points} where id = ${row.customer_id}`;
          }
        }
        return { ok: true, provider: "mpesa-tz", transactionRef: txnId };
      }

      return {
        ok: false,
        provider: "mpesa-tz",
        error: String(json?.output_ResponseDesc ?? `Unexpected response code ${code}`),
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      return { ok: false, provider: "mpesa-tz", error: msg };
    }
  },
};
