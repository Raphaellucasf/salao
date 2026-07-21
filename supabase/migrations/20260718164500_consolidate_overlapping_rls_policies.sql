-- Remove redundant permissive policies while preserving the intended read matrix.
-- Administrative writes use the canonical role helper; service_role bypasses RLS.

drop policy if exists "Somente autenticados leem clientes" on public.clientes;
alter policy "Admins e recepcionistas gerenciam clientes" on public.clientes to authenticated;

drop policy if exists "Somente autenticados leem comanda_itens" on public.comanda_itens;
alter policy "Autenticados gerenciam comanda_itens" on public.comanda_itens to authenticated;

drop policy if exists "Somente autenticados leem comandas" on public.comandas;
alter policy "Autenticados gerenciam comandas" on public.comandas to authenticated;

drop policy if exists "Admins gerenciam fornecedores" on public.fornecedores;
alter policy "Somente autenticados leem fornecedores" on public.fornecedores to authenticated;
create policy fornecedores_admin_insert on public.fornecedores for insert to authenticated
  with check ((select private.is_authenticated_admin()));
create policy fornecedores_admin_update on public.fornecedores for update to authenticated
  using ((select private.is_authenticated_admin())) with check ((select private.is_authenticated_admin()));
create policy fornecedores_admin_delete on public.fornecedores for delete to authenticated
  using ((select private.is_authenticated_admin()));

drop policy if exists "Admins gerenciam grupos_produtos" on public.grupos_produtos;
alter policy "Somente autenticados leem grupos_produtos" on public.grupos_produtos to authenticated;
create policy grupos_produtos_admin_insert on public.grupos_produtos for insert to authenticated
  with check ((select private.is_authenticated_admin()));
create policy grupos_produtos_admin_update on public.grupos_produtos for update to authenticated
  using ((select private.is_authenticated_admin())) with check ((select private.is_authenticated_admin()));
create policy grupos_produtos_admin_delete on public.grupos_produtos for delete to authenticated
  using ((select private.is_authenticated_admin()));

drop policy if exists "Admins gerenciam grupos_servicos" on public.grupos_servicos;
alter policy "Grupos servicos publicos para leitura" on public.grupos_servicos to anon, authenticated;
create policy grupos_servicos_admin_insert on public.grupos_servicos for insert to authenticated
  with check ((select private.is_authenticated_admin()));
create policy grupos_servicos_admin_update on public.grupos_servicos for update to authenticated
  using ((select private.is_authenticated_admin())) with check ((select private.is_authenticated_admin()));
create policy grupos_servicos_admin_delete on public.grupos_servicos for delete to authenticated
  using ((select private.is_authenticated_admin()));

drop policy if exists "Admins gerenciam pacotes_servicos" on public.pacotes_servicos;
alter policy "Pacotes publicos para leitura" on public.pacotes_servicos to anon, authenticated;
create policy pacotes_servicos_admin_insert on public.pacotes_servicos for insert to authenticated
  with check ((select private.is_authenticated_admin()));
create policy pacotes_servicos_admin_update on public.pacotes_servicos for update to authenticated
  using ((select private.is_authenticated_admin())) with check ((select private.is_authenticated_admin()));
create policy pacotes_servicos_admin_delete on public.pacotes_servicos for delete to authenticated
  using ((select private.is_authenticated_admin()));

drop policy if exists "Admins gerenciam produtos" on public.produtos;
drop policy if exists auth_all_produtos on public.produtos;
alter policy "Somente autenticados leem produtos" on public.produtos to authenticated;
create policy produtos_admin_insert on public.produtos for insert to authenticated
  with check ((select private.is_authenticated_admin()));
create policy produtos_admin_update on public.produtos for update to authenticated
  using ((select private.is_authenticated_admin())) with check ((select private.is_authenticated_admin()));
create policy produtos_admin_delete on public.produtos for delete to authenticated
  using ((select private.is_authenticated_admin()));

drop policy if exists "Admins gerenciam profissionais" on public.profissionais;
alter policy "Autenticados podem ler profissionais" on public.profissionais to anon, authenticated;
create policy profissionais_admin_insert on public.profissionais for insert to authenticated
  with check ((select private.is_authenticated_admin()));
create policy profissionais_admin_update on public.profissionais for update to authenticated
  using ((select private.is_authenticated_admin())) with check ((select private.is_authenticated_admin()));
create policy profissionais_admin_delete on public.profissionais for delete to authenticated
  using ((select private.is_authenticated_admin()));

drop policy if exists "Admins gerenciam servico_etapas" on public.servico_etapas;
drop policy if exists auth_all_servico_etapas on public.servico_etapas;
drop policy if exists "Somente autenticados leem servico_etapas" on public.servico_etapas;
alter policy anon_select_servico_etapas on public.servico_etapas to anon;
create policy authenticated_select_servico_etapas on public.servico_etapas for select to authenticated using (true);
create policy servico_etapas_admin_insert on public.servico_etapas for insert to authenticated
  with check ((select private.is_authenticated_admin()));
create policy servico_etapas_admin_update on public.servico_etapas for update to authenticated
  using ((select private.is_authenticated_admin())) with check ((select private.is_authenticated_admin()));
create policy servico_etapas_admin_delete on public.servico_etapas for delete to authenticated
  using ((select private.is_authenticated_admin()));

drop policy if exists "Admins gerenciam servicos" on public.servicos;
alter policy "Servicos publicos para leitura" on public.servicos to anon, authenticated;
create policy servicos_admin_insert on public.servicos for insert to authenticated
  with check ((select private.is_authenticated_admin()));
create policy servicos_admin_update on public.servicos for update to authenticated
  using ((select private.is_authenticated_admin())) with check ((select private.is_authenticated_admin()));
create policy servicos_admin_delete on public.servicos for delete to authenticated
  using ((select private.is_authenticated_admin()));

drop policy if exists auth_all_units on public.units;
alter policy anon_select_units on public.units to anon;
create policy authenticated_select_units on public.units for select to authenticated using (true);
create policy units_admin_insert on public.units for insert to authenticated
  with check ((select private.is_authenticated_admin()));
create policy units_admin_update on public.units for update to authenticated
  using ((select private.is_authenticated_admin())) with check ((select private.is_authenticated_admin()));
create policy units_admin_delete on public.units for delete to authenticated
  using ((select private.is_authenticated_admin()));

drop policy if exists "Admins gerenciam usuarios" on public.usuarios;
drop policy if exists "Usuario ve proprio registro" on public.usuarios;
drop policy if exists usuarios_delete_admin on public.usuarios;
drop policy if exists usuarios_insert_admin on public.usuarios;
drop policy if exists usuarios_select_admin on public.usuarios;
drop policy if exists usuarios_select_own on public.usuarios;
drop policy if exists usuarios_update_admin on public.usuarios;
drop policy if exists usuarios_update_own on public.usuarios;
create policy usuarios_select_canonical on public.usuarios for select to authenticated
  using (auth_id = (select auth.uid()) or (select private.is_authenticated_admin()));
create policy usuarios_insert_admin on public.usuarios for insert to authenticated
  with check ((select private.is_authenticated_admin()));
create policy usuarios_update_canonical on public.usuarios for update to authenticated
  using (auth_id = (select auth.uid()) or (select private.is_authenticated_admin()))
  with check (auth_id = (select auth.uid()) or (select private.is_authenticated_admin()));
create policy usuarios_delete_admin on public.usuarios for delete to authenticated
  using ((select private.is_authenticated_admin()));
