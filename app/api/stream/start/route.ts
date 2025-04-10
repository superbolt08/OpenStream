import { verifySession } from "@/app/lib/dal";
import { v4 as uuidv4 } from 'uuid';
import { prisma } from "@/prisma/index";
import { NextResponse } from "next/server";

const HOST = process.env.STREAM_SERVER_HOST || "localhost";
const PORT = process.env.STREAM_SERVER_PORT || "5080";

export async function PATCH() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json(
      { error: "User is not authenticated" },
      { status: 401 }
    );
  }

  try {
    const sessionId = session.sessionId;
    const streamKey = uuidv4();

    await prisma.session.update({
      where: { id: sessionId },
      data: {
        streamKey: streamKey,
      },
    });


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
    
    const playbackURL = `http://${HOST}:${PORT}/WebRTCApp/streams/${streamKey}.m3u8`;
    await prisma.stream.update({
      where: { sessionId: sessionId },
      data: {
        playbackURL,
        active: true,
        createdAt: new Date(),
      },
    });

    const stream = await prisma.stream.findUnique({
      where: { sessionId: sessionId },
      include: {
        session: true,
        chat: true,
      },
    });
    
    const data = {
      id: stream?.id,
      streamer: stream?.session.user,
      title: stream?.title,
      playbackURL: stream?.playbackURL,
      createdAt: stream?.createdAt,
      chatId: stream?.chat?.id,
    };
    
    return NextResponse.json(
      { message: "Stream started successfully", streamInfo: data, streamKey: streamKey },
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
