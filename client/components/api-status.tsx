import { api } from "@/lib/api/client";

/** Server component: shows whether the server API answers. Render it inside <Suspense>. */
export async function ApiStatus() {
  try {
    await api.get<null>("/status", { cache: "no-store" });
    return <p className="text-sm text-green-600">API connected</p>;
  } catch {
    return <p className="text-sm text-red-600">API unreachable: is the server running?</p>;
  }
}
