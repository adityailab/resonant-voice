import { prisma } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const period = searchParams.get("period") || "all";

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - 86400000);
  const startOfLastWeek = new Date(startOfToday.getTime() - 7 * 86400000);

  let where = {};
  if (period === "today") {
    where = { spokenAt: { gte: startOfToday } };
  } else if (period === "yesterday") {
    where = { spokenAt: { gte: startOfYesterday, lt: startOfToday } };
  } else if (period === "last-week") {
    where = { spokenAt: { gte: startOfLastWeek } };
  }

  const entries = await prisma.historyEntry.findMany({
    where,
    orderBy: { spokenAt: "desc" },
  });

  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const entry = await prisma.historyEntry.create({ data: body });
  return NextResponse.json(entry, { status: 201 });
}
