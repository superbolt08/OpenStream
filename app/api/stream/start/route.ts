import { verifySession } from "@/app/lib/dal";
import { prisma } from "@/prisma/index";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  // Verify that the user is authenticated.
  const session = await verifySession();
  if (!session) {
    return NextResponse.json(
      { error: "User is not authenticated" },
      { status: 401 }
    );
  }

  try {
    // Parse the JSON body of the request.
    const body = await req.json();
    const {
      streamKey,
      title,
      playbackUrl,
      sessionId = session.sessionId,
    } = body;

    if (!streamKey || !title || !playbackUrl) {
      return NextResponse.json(
        { message: "streamKey, title and playbackUrl are required" },
        { status: 400 }
      );
    }

    // Check if a stream already exists for this session.
    const sessionRecord = await prisma.session.findUnique({
      where: { id: sessionId },
      select: { stream: { select: { streamKey: true } } },
    });
    if (sessionRecord?.stream) {
      return NextResponse.json(
        { error: "Stream already exists for this session." },
        { status: 400 }
      );
    }

    // If the stream server call is successful, create the stream record in the database.
    const stream = await prisma.stream.create({
      data: {
        sessionId,
        streamKey,
        title,
        playbackUrl,
      },
    });

    // Create an associated chat record.
    await prisma.chat.create({
      data: { streamKey: stream.id },
    });

    return NextResponse.json(
      { message: "Stream created successfully", stream },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error creating stream:", error);
    return NextResponse.json(
      { error: "Error creating stream" },
      { status: 400 }
    );
  }
}
