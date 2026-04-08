import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");

  const phrases = await prisma.phrase.findMany({
    where: category ? { category } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(phrases);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const phrase = await prisma.phrase.create({ data: body });
  return NextResponse.json(phrase, { status: 201 });
}
