import { verifySession } from "@/app/lib/dal";
import { prisma } from "@/prisma/index";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json(
      { error: "User is not authenticated" },
      { status: 401 }
    );
  }

  try {
    const sessionId = session.sessionId;
    // Here we assume no title is provided.
    // Instead, we simply confirm that the stream record exists for this session.
    const sessionRecord = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { stream: true, streamKey: true },
    });

    if (!sessionRecord?.stream) {
      return NextResponse.json(
        { error: "No stream exists for this session." },
        { status: 400 }
      );
    }

    await prisma.stream.update({
      where: { sessionId: sessionId },
      data: {
        active: true,
        createdAt: new Date(),
      },
    });



    // Here, you might update additional fields if needed,
    // but for now we simply return the streamKey.
    return NextResponse.json(
      { message: "Stream started successfully", streamKey: sessionRecord.streamKey },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error starting stream:", error);
    return NextResponse.json(
      { error: "Error starting stream" },
      { status: 400 }
    );
  }
}
