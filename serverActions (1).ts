"use server";

import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Tool, TimeSavedBucket, ReworkLevel, Outcome } from "@prisma/client";
import { redirect } from "next/navigation";

function boolFromForm(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}

export async function createEventAction(formData: FormData) {
  const user = await requireUser();

  const tool = String(formData.get("tool") ?? "") as Tool;
  const categoryId = String(formData.get("categoryId") ?? "");
  const timeSaved = String(formData.get("timeSaved") ?? "") as TimeSavedBucket;
  const rework = String(formData.get("rework") ?? "") as ReworkLevel;
  const outcome = String(formData.get("outcome") ?? "") as Outcome;

  const riskPersonal = boolFromForm(formData.get("riskPersonal"));
  const riskPayment = boolFromForm(formData.get("riskPayment"));
  const riskInternal = boolFromForm(formData.get("riskInternal"));
  const note = String(formData.get("note") ?? "").trim() || null;

  const approved = await prisma.approvedTool.findUnique({ where: { tool } });
  const toolApproved = approved ? approved.approved : false;

  await prisma.aiEvent.create({
    data: {
      userId: user.id,
      tool,
      categoryId,
      timeSaved,
      rework,
      outcome,
      riskPersonal,
      riskPayment,
      riskInternal,
      toolApproved,
      note,
    },
  });

  redirect("/dashboard");
}
