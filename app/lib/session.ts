import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/prisma/index";
import type { SessionPayload } from "@/app/lib/defintions";

const secretKey = process.env.SESSION_SECRET;
if (!secretKey) {
  throw new Error("SESSION_SECRET environment variable is not defined.");
}
const encodedKey = new TextEncoder().encode(secretKey);

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedKey);
}

export async function decrypt(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch (error) {
    console.log("Failed to verify session", error);
    return null;
  }
}

export async function createSession(user: string) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const session = await prisma.session.create({
    data: {
      user,
      expiresAt,
    },
  });

  const id = session.id;
  const token = await encrypt({ id, expiresAt });

  const cookieStore = await cookies();
  cookieStore.set("session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function updateSession(user: string) {
  const token = (await cookies()).get("session")?.value;
  const payload = await decrypt(token);
  if (!token || !payload || !payload.id) {
    return null;
  }

  const id = payload.id;

  await prisma.session.update({
    where: { id: id },
    data: { user },
  });

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const newToken = await encrypt({ id, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set("session", newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    sameSite: "lax",
    path: "/",
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  if (token) {
    const payload = await decrypt(token);
    if (payload && payload.id) {
      await prisma.session.delete({
        where: { id: payload.id },
      });
    }
  }
  
  cookieStore.delete("session");
}

