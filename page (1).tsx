import { loginAction } from "./serverActions";

export default function LoginPage({ searchParams }: { searchParams?: { error?: string } }) {
  return (
    <div className="container">
      <h1 className="h1">Login</h1>
      <p className="muted">Use the admin credentials you set in <code>.env</code> (seeded into the database).</p>

      {searchParams?.error ? (
        <div className="card" style={{ borderColor: "rgba(239,68,68,.35)" }}>
          <strong>Login failed:</strong> <span className="muted">{searchParams.error}</span>
        </div>
      ) : null}

      <div style={{ height: 12 }} />
      <div className="card">
        <form action={loginAction}>
          <div className="field">
            <label className="label">Email</label>
            <input name="email" type="email" placeholder="you@company.com" required />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input name="password" type="password" placeholder="••••••••" required />
          </div>
          <button className="btn" type="submit">Login</button>
        </form>
      </div>
    </div>
  );
}
