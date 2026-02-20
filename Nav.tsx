import Link from "next/link";
import { Role } from "@prisma/client";

export default function Nav({ role }: { role?: Role }) {
  return (
    <div className="nav">
      <div className="brand">Support AI ROI</div>
      <div className="row">
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/log">Log AI assist</Link>
        {role === "ADMIN" ? <Link href="/admin">Admin</Link> : null}
        <Link href="/logout" className="btn btn-secondary">Logout</Link>
      </div>
    </div>
  );
}
