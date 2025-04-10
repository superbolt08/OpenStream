import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/index";

export async function GET(req: NextRequest, { params }: { params: { streamId: string } }) {
  try {

    const { streamId } = await params;

    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      select: {
        id: true,
        session: { select: { user: true } },
        title: true,
        playbackURL: true,
        createdAt: true,
        chat: { select: { id: true } },
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
      { message: "Stream retreived successfully", stream: data },
      { status: 200 }
    );
  } catch (error) {
    console.error("Failed to retreive stream:", error);
    return NextResponse.json(
      { error: "Failed to retreive stream" },
      { status: 400 }
    );
  }
}
