import { NextResponse } from "next/server";
import { updateSession } from "@/app/lib/session";

export async function POST(request: Request) {
  const { username } = await request.json();
  if (!username) {
    return NextResponse.json({ error: "Missing username" }, { status: 400 });
  }
  
  await updateSession(username);
  return NextResponse.json({ message: "Session updated", username });
}
