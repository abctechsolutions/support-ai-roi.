import { logout } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function LogoutPage() {
  await logout();
  redirect("/login");
}
