import { NextResponse } from "next/server";
import { getSessionOrNull } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSessionOrNull();
  const availableUsers = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      role: true,
      rfidBadgeId: true,
    },
  });

  return NextResponse.json({
    success: true,
    authenticated: session !== null,
    session,
    availableUsers,
  });
}
