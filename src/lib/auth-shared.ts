// Types + JWT helpers safe to use in both edge proxy and node server actions.
import { jwtVerify, SignJWT } from "jose";

export type StaffRole = "admin" | "staff";

export type StaffSession = {
  staffId: string;
  email: string;
  role: StaffRole;
  fullName: string | null;
};

export const SESSION_COOKIE = "franky_admin";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8h

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET must be set to a string of at least 16 characters");
  }
  return new TextEncoder().encode(s);
}

export async function signSession(s: StaffSession): Promise<string> {
  return await new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<StaffSession | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (
      typeof payload.staffId === "string" &&
      typeof payload.email === "string" &&
      (payload.role === "admin" || payload.role === "staff")
    ) {
      return {
        staffId: payload.staffId,
        email: payload.email,
        role: payload.role,
        fullName: typeof payload.fullName === "string" ? payload.fullName : null,
      };
    }
    return null;
  } catch {
    return null;
  }
}
