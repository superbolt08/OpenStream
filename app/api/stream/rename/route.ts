import { verifySession } from "@/app/lib/dal";
import { prisma } from "@/prisma/index";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "User is not authenticated" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { streamKey, newTitle, sessionId = session.sessionId } = body;

    if (!streamKey || !newTitle) {
      return NextResponse.json(
        { message: "streamKey and newTitle are required" },
        { status: 400 }
      );
    }

    // Check if a stream exists for this session and validate the stream key.
    const sessionRecord = await prisma.session.findUnique({
      where: { id: sessionId },
      select: {
        stream: { select: { streamKey: true } },
      },
    });

    if (sessionRecord?.stream) {
      if (sessionRecord.stream.streamKey !== streamKey) {
        return NextResponse.json(
          { error: "Provided stream key does not match the one already associated with your session." },
          { status: 400 }
        );
      }
    }

    const stream = await prisma.stream.update({
      where: { id: streamKey },
      data: { title: newTitle },
    });

    return NextResponse.json(
      { message: "Stream renamed successfully", stream },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error renaming stream:", error);
    return NextResponse.json({ error: "Error renaming stream" }, { status: 400 });
  }
}
