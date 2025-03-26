import { verifySession } from "@/app/lib/dal";
import { prisma } from "@/prisma/index";
import { NextRequest, NextResponse } from "next/server";

const STREAM_SERVER_HOST = process.env.STREAM_SERVER_HOST || "localhost";
const STREAM_PORT = process.env.STREAM_PORT || "4000";

export async function DELETE(req: NextRequest) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json(
      { error: "User is not authenticated" },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { streamKey, sessionId = session.sessionId } = body;
    if (!streamKey) {
      return NextResponse.json(
        { message: "streamKey is required" },
        { status: 400 }
      );
    }

    // Check if the stream exists
    const streamRecord = await prisma.stream.findUnique({
      where: { id: streamKey },
      select: { sessionId: true },
    });

    if (!streamRecord) {
      return NextResponse.json({ error: "Stream not found" }, { status: 404 });
    }

    // Check if the stream belongs to this session
    if (streamRecord.sessionId !== sessionId) {
      return NextResponse.json(
        {
          error:
            "Provided stream key does not match the one associated with your session.",
        },
        { status: 400 }
      );
    }

    // Call the stream server to stop the stream
    const streamServerUrl = `http://${STREAM_SERVER_HOST}:${STREAM_PORT}/stop/${streamKey}`;

    const stopResponse = await fetch(streamServerUrl, {
      method: "POST",
    });
    if (!stopResponse.ok) {
      console.error("Failed to stop stream on stream server");
      return NextResponse.json(
        { error: "Failed to stop stream on stream server" },
        { status: 500 }
      );
    }

    // Delete the stream record from the database.
    const deletedStream = await prisma.stream.delete({
      where: { id: streamKey },
    });

    return NextResponse.json(
      { message: "Stream ended successfully", stream: deletedStream },
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
