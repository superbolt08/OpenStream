import "server-only";
import { cookies } from "next/headers";
import { decrypt } from "@/app/lib/session";
import { cache } from "react";
import { prisma } from "@/prisma/index";

export const verifySession = cache(async () => {
  const cookie = (await cookies()).get("session")?.value;
  const session = await decrypt(cookie);
  if (!session) {
    return null;
  }

  return { isAuth: true, sessionId: session.id };
});

export const getUser = cache(async () => {
  const session = await verifySession();
  if (!session) return null;

  try {
    const user = await prisma.session.findUnique({
      where: {
        id: session.sessionId,
      },
      select: {
        user: true,
        stream: {
          select: {
            id: true,
          },
        },
      },
    });

    return {
      username: user?.user,
      streamId: user?.stream ? user.stream.id : undefined,
    };
  } catch (error) {
    console.log("Failed to fetch user", error);
    return null;
  }
});

