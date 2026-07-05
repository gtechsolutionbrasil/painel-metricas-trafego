import { redirect } from "next/navigation";

type SP = Promise<Record<string, string | string[] | undefined>>;

// Rota antiga — o conteúdo agora vive em /google e /meta.
export default async function TrafegoPagoRedirect({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string" && k !== "platform") qs.set(k, v);
  }
  const target = sp.platform === "meta" ? "/meta" : "/google";
  redirect(`${target}${qs.size ? `?${qs}` : ""}`);
}
