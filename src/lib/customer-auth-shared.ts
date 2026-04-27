import { jwtVerify, SignJWT } from "jose";

export type CustomerSession = {
  customerId: string;
  email: string;
  fullName: string | null;
};

export const CUSTOMER_COOKIE = "franky_customer";
export const CUSTOMER_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET must be set");
  }
  return new TextEncoder().encode(s);
}

export async function signCustomer(s: CustomerSession): Promise<string> {
  return await new SignJWT({ ...s, kind: "customer" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${CUSTOMER_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyCustomer(token: string): Promise<CustomerSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      payload.kind === "customer" &&
      typeof payload.customerId === "string" &&
      typeof payload.email === "string"
    ) {
      return {
        customerId: payload.customerId,
        email: payload.email,
        fullName: typeof payload.fullName === "string" ? payload.fullName : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}
