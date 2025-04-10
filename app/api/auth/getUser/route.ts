// app/api/auth/getUser/route.ts
import { getUser } from '@/app/lib/dal';
import { NextResponse } from 'next/server';

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
  }
  return NextResponse.json({ user });
}
