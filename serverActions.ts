"use server";

import { loginWithEmailPassword } from "@/lib/auth";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const res = await loginWithEmailPassword(email, password);
  if (!res.ok) {
    redirect(`/login?error=${encodeURIComponent(res.error)}`);
  }
  redirect("/dashboard");
}
