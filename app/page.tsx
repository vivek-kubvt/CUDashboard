import { Dashboard } from "@/components/Dashboard";
import { fetchDashboardData } from "@/lib/fetchUsage";

export const dynamic = "force-dynamic";

export default async function Page() {
  let initialData;
  try {
    initialData = await fetchDashboardData();
  } catch {
    initialData = undefined;
  }
  return <Dashboard initialData={initialData} />;
}
