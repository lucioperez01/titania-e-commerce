import { NextResponse } from "next/server";
import { prisma } from "@/infrastructure/db/prismaClient";

function validateAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("CRON_SECRET is not configured");
    return false;
  }
  const authHeader = request.headers.get("authorization");
  // Vercel Cron sends: "Authorization: Bearer <cron-secret>"
  return authHeader === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!validateAuth(request)) {
    console.warn("Unauthorized cron request to keep-alive");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("keep-alive cron error:", error);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 }
    );
  }
}
