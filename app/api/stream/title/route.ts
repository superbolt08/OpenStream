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
    const body = await req.json();
    const { title } = body;

    if (!title) {
      return NextResponse.json(
        { message: "Title is required" },
        { status: 400 }
      );
    }

    // Find the session record, including its stream and streamKey.
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

    if (!sessionRecord?.streamKey) {
      return NextResponse.json(
        { error: "No streamKey exists for this session." },
        { status: 400 }
      );
    }

    // Update the stream record: update title, mark active as true, update createdAt.
    await prisma.stream.update({
      where: { sessionId: sessionId },
      data: {
        title
      },
    });

    return NextResponse.json(
      { message: "Stream title updated successfully"},
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating stream title:", error);
    return NextResponse.json(
      { error: "Error updating stream title" },
      { status: 400 }
    );
  }
}
