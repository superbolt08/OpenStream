import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/index";

export async function GET(req: NextRequest) {
  try {
    const wsUrl = "http://websocket:3005/active-streams";
    const wsResponse = await fetch(wsUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!wsResponse.ok) {
      return NextResponse.json(
        { error: `Failed to fetch active streams from WebSocket server` },
        { status: 500 }
      );
    }
    const wsData = await wsResponse.json();

    const activeKeys = new Set(
      wsData.streams.map((s: { streamKey: string }) => s.streamKey)
    );

    const sessions = await prisma.session.findMany({
      where: { stream: { isNot: null } },
      select: { id: true, streamKey: true },
    });


    for (const s of sessions) {
      const isActive = activeKeys.has(s.streamKey);
      await prisma.stream.update({
        where: { sessionId: s.id },
        data: {
          active: isActive,
        },
      });
    }

    // Step 4: Fetch streams to return.
    // Adjust this filter to return the streams you need.
    const streams = await prisma.stream.findMany({
      where: { active: true },
      select: {
        id: true,
        session: { select: { user: true } },
        title: true,
        playbackURL: true,
        createdAt: true,
        chat: { select: { id: true } },
      },
    });


    const data = streams.map((stream) => ({
      id: stream.id,
      streamer: stream.session.user,
      title: stream.title,
      playbackURL: stream.playbackURL,
      createdAt: stream.createdAt,
      chatId: stream.chat?.id,
    }));

    return NextResponse.json(
      { message: "Streams updated successfully", streams: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to update active streams:", error);
    return NextResponse.json(
      { error: "Failed to update active streams" },
      { status: 400 }
    );
  }
}
