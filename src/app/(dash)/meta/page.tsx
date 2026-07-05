import { ChannelPage } from "@/components/pages/ChannelPage";

type SP = Promise<Record<string, string | string[] | undefined>>;

export default async function MetaPage({
  searchParams,
}: {
  searchParams: SP;
}) {
  return (
    <ChannelPage
      platform="meta"
      title="Meta"
      subtitle="Anúncios no Facebook e Instagram"
      searchParams={await searchParams}
    />
  );
}
