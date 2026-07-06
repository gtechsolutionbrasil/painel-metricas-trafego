import { ChannelPage } from "@/components/pages/ChannelPage";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function GooglePage({
  searchParams,
}: {
  searchParams: SP;
}) {
  return (
    <ChannelPage
      platform="google"
      title="Google Ads"
      subtitle="Anúncios no Google (pesquisa e rede)"
      searchParams={await searchParams}
    />
  );
}
