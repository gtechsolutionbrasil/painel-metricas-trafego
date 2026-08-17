"use client";

import { Trash2 } from "lucide-react";
import { deleteClient } from "./actions";

// Botão de excluir cliente com confirmação nativa antes de enviar a action.
export function DeleteClientButton({
  clientId,
  clientName,
}: {
  clientId: string;
  clientName: string;
}) {
  return (
    <form
      action={deleteClient}
      onSubmit={(e) => {
        const ok = window.confirm(
          `Excluir "${clientName}"?\n\nIsso remove também as integrações e todas as métricas coletadas desse cliente. Não dá pra desfazer.`,
        );
        if (!ok) e.preventDefault();
      }}
    >
      <input type="hidden" name="clientId" value={clientId} />
      <input type="hidden" name="clientName" value={clientName} />
      <button
        type="submit"
        title={`Excluir ${clientName}`}
        className="grid h-8 w-8 place-items-center rounded-lg border border-transparent text-faint transition-colors hover:border-danger-border hover:bg-danger-soft hover:text-danger-ink"
      >
        <Trash2 size={15} />
      </button>
    </form>
  );
}
