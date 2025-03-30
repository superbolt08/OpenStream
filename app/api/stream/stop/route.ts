import { verifySession } from "@/app/lib/dal";
import { prisma } from "@/prisma/index";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json(
      { error: "User is not authenticated" },
      { status: 401 }
    );
  }

  try {
    const sessionId = session.sessionId
    
    // Check if the stream exists
    const sessionRecord = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { stream: true },
    });


    if (!sessionRecord?.stream) {
      return NextResponse.json(
        { error: "No stream exists for this session." },
        { status: 400 }
      );
    }

    const updatedStream = await prisma.stream.update({
      where: { sessionId: sessionId },
      data: {
        active: false,
      },
    });

    return NextResponse.json(
      { message: "Stream ended successfully", stream: updatedStream },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error ending stream:", error);
    return NextResponse.json(
      { error: "Error ending stream" },
      { status: 400 }
    );
  }
}
