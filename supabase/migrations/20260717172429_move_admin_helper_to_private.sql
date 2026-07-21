create schema if not exists private;

revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated, service_role;

revoke all on function public.is_admin() from public, anon, authenticated;
grant execute on function public.is_admin() to service_role;

alter function public.is_authenticated_admin() set schema private;
revoke all on function private.is_authenticated_admin() from public, anon, authenticated;
grant execute on function private.is_authenticated_admin() to authenticated, service_role;
