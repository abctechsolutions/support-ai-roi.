import Nav from "@/components/Nav";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createEventAction } from "./serverActions";

export default async function LogPage() {
  const user = await requireUser();
  const categories = await prisma.category.findMany({ where: { active: true }, orderBy: { name: "asc" } });

  const approvedTools = await prisma.approvedTool.findMany({ orderBy: { tool: "asc" } });

  return (
    <div className="container">
      <Nav role={user.role} />
      <h1 className="h1">Log AI assist</h1>
      <p className="muted">10 seconds. No prompts. Just ROI + quality + risk signals.</p>

      <div className="card">
        <form action={createEventAction}>
          <div className="field">
            <label className="label">Tool used</label>
            <select name="tool" required>
              <option value="CHATGPT">ChatGPT</option>
              <option value="CLAUDE">Claude</option>
              <option value="COPILOT">Copilot</option>
              <option value="GEMINI">Gemini</option>
              <option value="OTHER">Other</option>
            </select>
            <small className="muted">Approved tools can be managed in Admin.</small>
          </div>

          <div className="field">
            <label className="label">Use-case category</label>
            <select name="categoryId" required>
              {categories.map((c) => (
                <option value={c.id} key={c.id}>{c.name} (default {c.defaultMinLow}-{c.defaultMinHigh}m)</option>
              ))}
            </select>
          </div>

          <div className="grid grid-2">
            <div className="field">
              <label className="label">Time saved</label>
              <select name="timeSaved" required>
                <option value="M1_2">1–2 min</option>
                <option value="M3_5">3–5 min</option>
                <option value="M6_10">6–10 min</option>
                <option value="M11_20">11–20 min</option>
                <option value="M20_PLUS">20+ min</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Rework needed</label>
              <select name="rework" required>
                <option value="NONE">None</option>
                <option value="SOME">Some</option>
                <option value="HEAVY">Heavy</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label className="label">Outcome</label>
            <select name="outcome" required>
              <option value="SENT_TO_CUSTOMER">Sent to customer</option>
              <option value="INTERNAL_ONLY">Internal only</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>

          <div className="grid grid-2">
            <div className="field">
              <label className="label">Risk flags (tick any that apply)</label>
              <div className="card" style={{ padding: 12 }}>
                <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input type="checkbox" name="riskPersonal" /> <span>Customer personal data referenced</span>
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                  <input type="checkbox" name="riskPayment" /> <span>Payment/order details referenced</span>
                </label>
                <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="checkbox" name="riskInternal" /> <span>Internal company info referenced</span>
                </label>
              </div>
            </div>

            <div className="field">
              <label className="label">Note (optional)</label>
              <textarea name="note" rows={5} placeholder="(Optional) e.g., billing ticket macro, refund policy wording..." />
              <small className="muted">Keep it short. Don’t paste customer data.</small>
            </div>
          </div>

          <div style={{ height: 8 }} />
          <button className="btn" type="submit">Save event</button>
          <span style={{ marginLeft: 10 }} className="muted">Tip: log right after you use AI so the estimate stays honest.</span>

          <div style={{ height: 10 }} />
          <div className="muted">
            Approved tools right now:{" "}
            {approvedTools.filter(t => t.approved).map(t => t.tool).join(", ")}
          </div>
        </form>
      </div>
    </div>
  );
}
