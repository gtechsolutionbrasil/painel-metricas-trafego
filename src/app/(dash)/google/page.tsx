import { ChannelPage } from "@/components/pages/ChannelPage";
import { GoogleInsights } from "@/components/pages/GoogleInsights";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function GooglePage({
  searchParams,
}: {
  searchParams: SP;
}) {
  const sp = await searchParams;
  return (
    <ChannelPage
      platform="google"
      title="Google Ads"
      subtitle="Anúncios no Google (pesquisa e rede)"
      searchParams={sp}
      extra={<GoogleInsights searchParams={sp} />}
    />
  );
}
