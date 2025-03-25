import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/index';

export async function GET(req: NextRequest) {
  try {
    const streams = await prisma.stream.findMany({
      select: {
        id: true,
        streamKey: true,
        title: true,
        playbackUrl: true,
        createdAt: true,
        chat: { select: { id: true } },
      },
    });

    const data = streams.map((stream) => ({
      id: stream.id,
      streamKey: stream.streamKey,
      title: stream.title,
      playbackUrl: stream.playbackUrl,
      createdAt: stream.createdAt,
      chatId: stream.chat?.id,
    }));

    return NextResponse.json({message: "Streams fetched successfully", streams: data }, {status: 200});
  } catch (error) {
    console.error('Failed to fetch streams:', error);
    return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 });
  }
}
