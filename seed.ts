import { PrismaClient, Tool } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEFAULT_CATEGORIES: Array<{ name: string; low: number; high: number }> = [
  { name: "Summarise ticket thread", low: 4, high: 8 },
  { name: "Draft first reply", low: 5, high: 12 },
  { name: "Rewrite tone (friendly/professional)", low: 2, high: 5 },
  { name: "Troubleshooting steps", low: 6, high: 15 },
  { name: "Explain policy clearly", low: 4, high: 10 },
  { name: "Translate customer message", low: 2, high: 6 },
  { name: "Simplify technical explanation", low: 3, high: 8 },
  { name: "Create internal handoff note", low: 3, high: 7 },
  { name: "Escalation summary for Tier 2", low: 5, high: 10 },
  { name: "Suggest tags/category", low: 1, high: 3 },
  { name: "Extract key details (order/device/version)", low: 2, high: 5 },
  { name: "Refund/return wording", low: 3, high: 7 },
  { name: "Apology + service recovery", low: 3, high: 7 },
  { name: "Follow-up/check-in message", low: 2, high: 5 },
  { name: "GDPR/privacy response template", low: 4, high: 10 },
  { name: "Troubleshooting checklist", low: 6, high: 12 },
  { name: "Macro/canned response improvement", low: 3, high: 8 },
  { name: "Knowledge base article draft", low: 15, high: 40 },
  { name: "Call/chat recap summary", low: 4, high: 9 },
  { name: "Sentiment check (angry/confused)", low: 1, high: 3 },
];

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

async function main() {
  const email = requireEnv("ADMIN_EMAIL").toLowerCase().trim();
  const password = requireEnv("ADMIN_PASSWORD");
  const blendedRate = process.env.BLENDED_HOURLY_RATE_GBP ?? "20";

  // settings
  await prisma.setting.upsert({
    where: { key: "BLENDED_HOURLY_RATE_GBP" },
    update: { value: blendedRate },
    create: { key: "BLENDED_HOURLY_RATE_GBP", value: blendedRate },
  });

  // categories
  for (const c of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name: c.name },
      update: { defaultMinLow: c.low, defaultMinHigh: c.high, active: true },
      create: { name: c.name, defaultMinLow: c.low, defaultMinHigh: c.high, active: true },
    });
  }

  // approved tools
  const tools: Tool[] = ["CHATGPT", "CLAUDE", "COPILOT", "GEMINI", "OTHER"];
  for (const t of tools) {
    await prisma.approvedTool.upsert({
      where: { tool: t },
      update: { approved: true },
      create: { tool: t, approved: true },
    });
  }

  // default team
  const team = await prisma.team.upsert({
    where: { name: "Support" },
    update: {},
    create: { name: "Support" },
  });

  // admin user
  const existing = await prisma.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: { email, passwordHash, role: "ADMIN", teamId: team.id },
    });
    console.log(`Created admin: ${email}`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
