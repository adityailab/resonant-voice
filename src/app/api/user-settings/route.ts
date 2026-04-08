import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  let settings = await prisma.userSettings.findUnique({ where: { id: "default" } });
  if (!settings) {
    settings = await prisma.userSettings.create({
      data: { id: "default", voiceId: "default", speechRate: 1.0, theme: "light" },
    });
  }
  return NextResponse.json(settings);
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const settings = await prisma.userSettings.upsert({
    where: { id: "default" },
    update: body,
    create: { id: "default", ...body },
  });
  return NextResponse.json(settings);
}
