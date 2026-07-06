import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardBody } from "@/components/ui/Card";

// Estado vazio padrão do painel: usado quando um período/cliente/canal
// ainda não tem dados. Mantém a mesma linguagem simples do resto da UI.
export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description: ReactNode;
}) {
  return (
    <Card>
      <CardBody className="flex flex-col items-center gap-3 py-14 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-soft text-brand">
          <Icon size={22} />
        </span>
        <p className="text-base font-bold text-ink">{title}</p>
        <p className="max-w-md text-sm text-muted">{description}</p>
      </CardBody>
    </Card>
  );
}
