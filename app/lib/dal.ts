import "server-only";
import { cookies } from "next/headers";
import { decrypt } from "@/app/lib/session";
import { cache } from "react";
import { prisma } from "@/prisma/index";

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);

  if (!session) {
    // Either redirect or return a falsy session object.
    return null;
  }

  return { isAuth: true, sessionId: session.id };
});

export const getUser = cache(async () => {
  const session = await verifySession();
  // Check if the session is valid and has a sessionId.
  if (!session) return null;

  try {
    const user = await prisma.session.findUnique({
      where: {
        id: session.sessionId,
      },
      select: {
        user: true,
        stream: true,
      },
    });

    return user;
  } catch (error) {
    console.log("Failed to fetch user", error);
    return null;
  }
});
