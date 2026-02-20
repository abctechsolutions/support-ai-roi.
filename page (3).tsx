import Nav from "@/components/Nav";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { conservativeMinutes, formatHours } from "@/lib/metrics";
import { TimeSavedBucket } from "@prisma/client";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

export default async function DashboardPage({ searchParams }: { searchParams?: { days?: string } }) {
  const user = await requireUser();
  const days = Math.max(1, Math.min(90, Number(searchParams?.days ?? "7")));
  const from = startOfDay(new Date(Date.now() - days * 24 * 60 * 60 * 1000));

  const blendedRateSetting = await prisma.setting.findUnique({ where: { key: "BLENDED_HOURLY_RATE_GBP" } });
  const blendedRate = Number(blendedRateSetting?.value ?? "20");

  const whereBase: any = { createdAt: { gte: from } };
  // manager/user scoping
  if (user.role !== "ADMIN") {
    if (user.teamId) whereBase.user = { teamId: user.teamId };
    else whereBase.userId = user.id;
  }

  const [events, usersInScope] = await Promise.all([
    prisma.aiEvent.findMany({
      where: whereBase,
      include: { user: true, category: true },
      orderBy: { createdAt: "desc" },
      take: 5000,
    }),
    user.role === "ADMIN"
      ? prisma.user.count()
      : user.teamId
        ? prisma.user.count({ where: { teamId: user.teamId } })
        : prisma.user.count({ where: { id: user.id } }),
  ]);

  const uniqueUsers = new Set(events.map(e => e.userId));
  const wau = uniqueUsers.size;
  const totalSessions = events.length;

  const totalMinutes = events.reduce((acc, e) => acc + conservativeMinutes(e.timeSaved as TimeSavedBucket), 0);
  const hoursSaved = totalMinutes / 60;
  const valueGbp = hoursSaved * blendedRate;

  const reworkSome = events.filter(e => e.rework === "SOME").length;
  const reworkHeavy = events.filter(e => e.rework === "HEAVY").length;
  const reworkRate = totalSessions ? ((reworkSome + reworkHeavy) / totalSessions) * 100 : 0;

  const riskFlags = events.filter(e => e.riskPersonal || e.riskPayment || e.riskInternal || !e.toolApproved).length;

  const byCategory = new Map<string, { name: string; minutes: number; sessions: number; heavy: number }>();
  for (const e of events) {
    const key = e.categoryId;
    const cur = byCategory.get(key) ?? { name: e.category.name, minutes: 0, sessions: 0, heavy: 0 };
    cur.minutes += conservativeMinutes(e.timeSaved as TimeSavedBucket);
    cur.sessions += 1;
    cur.heavy += e.rework === "HEAVY" ? 1 : 0;
    byCategory.set(key, cur);
  }

  const topCats = [...byCategory.values()]
    .sort((a,b) => b.minutes - a.minutes)
    .slice(0, 8);

  const adoptionPct = usersInScope ? (wau / usersInScope) * 100 : 0;

  return (
    <div className="container">
      <Nav role={user.role} />
      <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="h1">Dashboard</h1>
          <div className="muted">Last {days} days • Scope: {user.role === "ADMIN" ? "All teams" : user.teamId ? "Your team" : "Your account"}</div>
        </div>
        <div className="row">
          <a className="btn btn-secondary" href={`/dashboard?days=7`}>7d</a>
          <a className="btn btn-secondary" href={`/dashboard?days=30`}>30d</a>
          <a className="btn btn-secondary" href={`/api/report?days=${days}`}>Export CSV</a>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="grid grid-4">
        <div className="card">
          <div className="label">Weekly active AI users</div>
          <div className="kpi">{wau}</div>
          <div className="muted">{adoptionPct.toFixed(0)}% adoption in scope</div>
        </div>
        <div className="card">
          <div className="label">AI sessions logged</div>
          <div className="kpi">{totalSessions}</div>
          <div className="muted">Up to 5k events shown</div>
        </div>
        <div className="card">
          <div className="label">Hours saved (conservative)</div>
          <div className="kpi">{formatHours(totalMinutes)}h</div>
          <div className="muted">£{valueGbp.toFixed(0)} value @ £{blendedRate}/hr</div>
        </div>
        <div className="card">
          <div className="label">Quality / risk</div>
          <div className="kpi">{reworkRate.toFixed(0)}%</div>
          <div className="muted">Rework rate • {riskFlags} risk-flagged sessions</div>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ margin: "0 0 10px" }}>Top ROI use-cases</h3>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Sessions</th>
                <th>Hours saved</th>
                <th>Heavy rework</th>
              </tr>
            </thead>
            <tbody>
              {topCats.length ? topCats.map((c) => (
                <tr key={c.name}>
                  <td>{c.name}</td>
                  <td>{c.sessions}</td>
                  <td>{formatHours(c.minutes)}</td>
                  <td>{c.heavy}</td>
                </tr>
              )) : (
                <tr><td colSpan={4} className="muted">No data yet — log your first AI assist.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ margin: "0 0 10px" }}>Most recent sessions</h3>
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Tool</th>
                <th>Category</th>
                <th>Saved</th>
                <th>Rework</th>
              </tr>
            </thead>
            <tbody>
              {events.slice(0, 12).map((e) => (
                <tr key={e.id}>
                  <td className="muted">{new Date(e.createdAt).toLocaleString()}</td>
                  <td><span className="badge">{e.tool}</span></td>
                  <td>{e.category.name}</td>
                  <td className="muted">{e.timeSaved.replace("M","").replace("_","-")}</td>
                  <td className="muted">{e.rework}</td>
                </tr>
              ))}
              {!events.length ? (
                <tr><td colSpan={5} className="muted">No sessions yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <h3 style={{ margin: "0 0 10px" }}>Next actions (auto)</h3>
        <ul className="muted" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.6 }}>
          <li><strong>Standardise</strong> the top ROI category into a macro/template (reduces rework).</li>
          <li><strong>Train</strong> low-adoption agents/teams with 3 approved patterns (summarise → draft → tone).</li>
          <li><strong>Control risk</strong> by reminding redaction policy when risk flags spike (personal/payment/internal).</li>
        </ul>
      </div>
    </div>
  );
}
