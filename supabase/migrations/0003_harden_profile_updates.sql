-- ============================================================================
-- Hardening: impede escalada de privilégio via update no próprio profile.
-- ============================================================================
-- A policy original permitia UPDATE da própria linha em public.profiles.
-- Como a coluna role vive na mesma tabela, isso deixava a autorização depender
-- de uma coluna que o próprio usuário poderia tentar alterar.
--
-- A partir desta migration, usuários autenticados só podem atualizar full_name.
-- role fica para service role, SQL Editor ou uma futura RPC administrativa.
-- ============================================================================

drop policy if exists "profiles_update_own" on public.profiles;

revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

create policy "profiles_update_own_full_name"
  on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
