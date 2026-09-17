import { redirect } from "next/navigation";
import { getSessionUserId } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) redirect("/login");
  return <Dashboard />;
}
