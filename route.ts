import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { conservativeMinutes } from "@/lib/metrics";
import { TimeSavedBucket } from "@prisma/client";

function csvEscape(s: string) {
  const needs = /[",\n]/.test(s);
  const out = s.replace(/"/g, '""');
  return needs ? `"${out}"` : out;
}

export async function GET(req: Request) {
  const user = await getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(req.url);
  const days = Math.max(1, Math.min(365, Number(url.searchParams.get("days") ?? "7")));
  const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  from.setHours(0,0,0,0);

  const whereBase: any = { createdAt: { gte: from } };
  if (user.role !== "ADMIN") {
    if (user.teamId) whereBase.user = { teamId: user.teamId };
    else whereBase.userId = user.id;
  }

  const blendedRateSetting = await prisma.setting.findUnique({ where: { key: "BLENDED_HOURLY_RATE_GBP" } });
  const blendedRate = Number(blendedRateSetting?.value ?? "20");

  const events = await prisma.aiEvent.findMany({
    where: whereBase,
    include: { category: true, user: { include: { team: true } } },
    orderBy: { createdAt: "asc" },
  });

  const totalMinutes = events.reduce((a, e) => a + conservativeMinutes(e.timeSaved as TimeSavedBucket), 0);
  const hoursSaved = totalMinutes / 60;
  const value = hoursSaved * blendedRate;

  const header = [
    "Support AI ROI Report",
    `Days=${days}`,
    `From=${from.toISOString().slice(0,10)}`,
    `Scope=${user.role === "ADMIN" ? "ALL" : (user.teamId ? "TEAM" : "USER")}`,
    `HoursSavedConservative=${hoursSaved.toFixed(2)}`,
    `ValueGBP=${value.toFixed(2)}`
  ].join(",");

  const rows: string[] = [];
  rows.push(header);
  rows.push("");
  rows.push(["createdAt","team","email","tool","category","timeSaved","rework","outcome","riskPersonal","riskPayment","riskInternal","toolApproved","note"].join(","));

  for (const e of events) {
    rows.push([
      csvEscape(new Date(e.createdAt).toISOString()),
      csvEscape(e.user.team?.name ?? ""),
      csvEscape(e.user.email),
      csvEscape(e.tool),
      csvEscape(e.category.name),
      csvEscape(e.timeSaved),
      csvEscape(e.rework),
      csvEscape(e.outcome),
      String(e.riskPersonal),
      String(e.riskPayment),
      String(e.riskInternal),
      String(e.toolApproved),
      csvEscape(e.note ?? "")
    ].join(","));
  }

  const csv = rows.join("\n");
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="support-ai-roi-${days}d.csv"`,
    },
  });
}
