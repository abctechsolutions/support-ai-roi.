import Nav from "@/components/Nav";
import { requireUser, requireRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTeamAction, createUserAction, updateToolAction, updateRateAction, updateCategoryAction } from "./serverActions";
import { Role, Tool } from "@prisma/client";

export default async function AdminPage() {
  const user = await requireUser();
  requireRole(user.role, ["ADMIN"]);

  const [teams, users, categories, tools, rateSetting] = await Promise.all([
    prisma.team.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ include: { team: true }, orderBy: { createdAt: "desc" }, take: 50 }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.approvedTool.findMany({ orderBy: { tool: "asc" } }),
    prisma.setting.findUnique({ where: { key: "BLENDED_HOURLY_RATE_GBP" } }),
  ]);

  const blendedRate = Number(rateSetting?.value ?? "20");

  return (
    <div className="container">
      <Nav role={user.role} />
      <h1 className="h1">Admin</h1>
      <p className="muted">Teams, users, approved tools, categories, and blended hourly rate.</p>

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ margin: "0 0 10px" }}>Create team</h3>
          <form action={createTeamAction}>
            <div className="field">
              <label className="label">Team name</label>
              <input name="name" placeholder="e.g., Support EU" required />
            </div>
            <button className="btn" type="submit">Create team</button>
          </form>

          <div style={{ height: 10 }} />
          <div className="muted">Existing teams: {teams.map(t => t.name).join(", ")}</div>
        </div>

        <div className="card">
          <h3 style={{ margin: "0 0 10px" }}>Create user</h3>
          <form action={createUserAction}>
            <div className="field">
              <label className="label">Email</label>
              <input name="email" type="email" placeholder="agent@company.com" required />
            </div>
            <div className="grid grid-2">
              <div className="field">
                <label className="label">Password</label>
                <input name="password" type="password" placeholder="Temporary password" required />
              </div>
              <div className="field">
                <label className="label">Role</label>
                <select name="role" defaultValue="USER">
                  <option value="USER">USER</option>
                  <option value="MANAGER">MANAGER</option>
                  <option value="ADMIN">ADMIN</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label className="label">Team</label>
              <select name="teamId">
                <option value="">(none)</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <button className="btn" type="submit">Create user</button>
          </form>
          <small className="muted">Tip: start with 1 manager + 10 agents for a pilot.</small>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="grid grid-2">
        <div className="card">
          <h3 style={{ margin: "0 0 10px" }}>Approved tools</h3>
          <table>
            <thead>
              <tr>
                <th>Tool</th>
                <th>Approved</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tools.map(t => (
                <tr key={t.id}>
                  <td><span className="badge">{t.tool}</span></td>
                  <td className="muted">{t.approved ? "Yes" : "No"}</td>
                  <td>
                    <form action={updateToolAction}>
                      <input type="hidden" name="tool" value={t.tool} />
                      <input type="hidden" name="approved" value={t.approved ? "0" : "1"} />
                      <button className={`btn ${t.approved ? "btn-danger" : ""}`} type="submit">
                        {t.approved ? "Disallow" : "Allow"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <small className="muted">If a tool is disallowed, logged events will show toolApproved=false (risk signal).</small>
        </div>

        <div className="card">
          <h3 style={{ margin: "0 0 10px" }}>Blended hourly rate (£/hr)</h3>
          <form action={updateRateAction}>
            <div className="field">
              <label className="label">Rate</label>
              <input name="rate" type="number" step="1" min="1" defaultValue={blendedRate} />
            </div>
            <button className="btn" type="submit">Save rate</button>
          </form>
          <small className="muted">Used to estimate £ value saved in the dashboard/report.</small>
        </div>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <h3 style={{ margin: "0 0 10px" }}>Categories (defaults)</h3>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Low</th>
              <th>High</th>
              <th>Active</th>
              <th>Save</th>
            </tr>
          </thead>
          <tbody>
            {categories.map(c => (
              <tr key={c.id}>
                <td style={{ width: "40%" }}>{c.name}</td>
                <td style={{ width: 90 }}>
                  <form action={updateCategoryAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="number" name="low" defaultValue={c.defaultMinLow} min="0" />
                </form>
                </td>
                <td style={{ width: 90 }}>
                  <form action={updateCategoryAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="number" name="high" defaultValue={c.defaultMinHigh} min="0" />
                </form>
                </td>
                <td className="muted">{c.active ? "Yes" : "No"}</td>
                <td>
                  <form action={updateCategoryAction}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="low" value={String(c.defaultMinLow)} />
                    <input type="hidden" name="high" value={String(c.defaultMinHigh)} />
                    <input type="hidden" name="toggleActive" value="1" />
                    <button className="btn btn-secondary" type="submit">{c.active ? "Disable" : "Enable"}</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <small className="muted">For MVP speed, categories are seeded — edit defaults here as you learn from pilots.</small>
      </div>

      <div style={{ height: 14 }} />

      <div className="card">
        <h3 style={{ margin: "0 0 10px" }}>Recent users (last 50)</h3>
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Role</th>
              <th>Team</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td className="muted">{u.role}</td>
                <td className="muted">{u.team?.name ?? "-"}</td>
                <td className="muted">{new Date(u.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
}
