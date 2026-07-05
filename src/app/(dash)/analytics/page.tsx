import { redirect } from "next/navigation";

type SP = Promise<Record<string, string | string[] | undefined>>;

// Rota antiga — o conteúdo agora vive em /site.
export default async function AnalyticsRedirect({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") qs.set(k, v);
  }
  redirect(`/site${qs.size ? `?${qs}` : ""}`);
}
