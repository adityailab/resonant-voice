import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const contacts = await prisma.emergencyContact.findMany({
    orderBy: { isPrimary: "desc" },
  });
  return NextResponse.json(contacts);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const contact = await prisma.emergencyContact.create({ data: body });
  return NextResponse.json(contact, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, ...data } = body;
  const contact = await prisma.emergencyContact.update({ where: { id }, data });
  return NextResponse.json(contact);
}
