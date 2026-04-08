import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const phrase = await prisma.phrase.findUnique({ where: { id } });
  if (!phrase) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(phrase);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const phrase = await prisma.phrase.update({ where: { id }, data: body });
  return NextResponse.json(phrase);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await prisma.phrase.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
