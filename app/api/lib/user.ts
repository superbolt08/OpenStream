import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/index";

export async function createUser(req: NextRequest) {
  try {
    const { name } = await req.json();

    if (!name) {
      return NextResponse.json(
        { message: "Name is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name,
      },
    });

    return NextResponse.json(
      { message: "User created susccesfully", user: user },
      { status: 200 }
    );
  } catch (error: any) {
    return NextResponse.json({ error: "Error creating user" }, { status: 400 });
  }
}
