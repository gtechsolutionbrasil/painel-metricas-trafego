import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/updateSession";

// Next 16: o antigo "middleware" foi renomeado para "proxy".
// Aqui fazemos o refresh da sessão Supabase e o gating de autenticação.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Roda em tudo, menos assets estáticos, imagens e arquivos públicos.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|brand/|.*\\.(?:png|jpg|jpeg|gif|svg|ico|webp)$).*)",
  ],
};
