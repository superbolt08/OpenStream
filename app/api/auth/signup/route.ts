import { NextRequest,NextResponse } from "next/server";
import { createSession } from "@/app/lib/session";

export async function POST(req: NextRequest) {
  const { username } = await req.json();
  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }
  await createSession(username);
  return NextResponse.json({ message: "Session created", username });
}
