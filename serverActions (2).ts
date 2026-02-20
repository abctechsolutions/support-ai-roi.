"use server";

import { requireUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { Role, Tool } from "@prisma/client";
import { redirect } from "next/navigation";

export async function createTeamAction(formData: FormData) {
  const user = await requireUser();
  requireRole(user.role, ["ADMIN"]);

  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin");

  await prisma.team.create({ data: { name } });
  redirect("/admin");
}

export async function createUserAction(formData: FormData) {
  const user = await requireUser();
  requireRole(user.role, ["ADMIN"]);

  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const role = String(formData.get("role") ?? "USER") as Role;
  const teamIdRaw = String(formData.get("teamId") ?? "");
  const teamId = teamIdRaw ? teamIdRaw : null;

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: { email, passwordHash, role, teamId: teamId ?? undefined },
  });

  redirect("/admin");
}

export async function updateToolAction(formData: FormData) {
  const user = await requireUser();
  requireRole(user.role, ["ADMIN"]);

  const tool = String(formData.get("tool") ?? "") as Tool;
  const approved = String(formData.get("approved") ?? "1") === "1";

  await prisma.approvedTool.upsert({
    where: { tool },
    update: { approved },
    create: { tool, approved },
  });

  redirect("/admin");
}

export async function updateRateAction(formData: FormData) {
  const user = await requireUser();
  requireRole(user.role, ["ADMIN"]);

  const rate = String(formData.get("rate") ?? "20");
  await prisma.setting.upsert({
    where: { key: "BLENDED_HOURLY_RATE_GBP" },
    update: { value: rate },
    create: { key: "BLENDED_HOURLY_RATE_GBP", value: rate },
  });

  redirect("/admin");
}

export async function updateCategoryAction(formData: FormData) {
  const user = await requireUser();
  requireRole(user.role, ["ADMIN"]);

  const id = String(formData.get("id") ?? "");
  const low = Number(String(formData.get("low") ?? "0"));
  const high = Number(String(formData.get("high") ?? "0"));
  const toggleActive = String(formData.get("toggleActive") ?? "") === "1";

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) redirect("/admin");

  await prisma.category.update({
    where: { id },
    data: {
      defaultMinLow: Number.isFinite(low) ? low : existing.defaultMinLow,
      defaultMinHigh: Number.isFinite(high) ? high : existing.defaultMinHigh,
      active: toggleActive ? !existing.active : existing.active,
    },
  });

  redirect("/admin");
}
