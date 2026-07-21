-- As views passam a avaliar privilégios e RLS como o chamador.
alter view public.vw_comanda_item_etapas_completas set (security_invoker = true);
alter view public.vw_agendamentos_completos set (security_invoker = true);
alter view public.vw_servicos_com_etapas set (security_invoker = true);
alter view public.vw_profissionais_com_grupos set (security_invoker = true);
alter view public.vw_etapas_agendadas set (security_invoker = true);
alter view public.vw_blocos_ocupados set (security_invoker = true);
alter view public.vw_servicos_n8n set (security_invoker = true);

-- Grants explícitos: nenhum acesso anônimo; leitura autenticada sujeita ao RLS.
revoke all privileges on
  public.vw_comanda_item_etapas_completas,
  public.vw_agendamentos_completos,
  public.vw_servicos_com_etapas,
  public.vw_profissionais_com_grupos,
  public.vw_etapas_agendadas,
  public.vw_blocos_ocupados,
  public.vw_servicos_n8n
from public, anon, authenticated;

grant select on
  public.vw_comanda_item_etapas_completas,
  public.vw_agendamentos_completos,
  public.vw_servicos_com_etapas,
  public.vw_profissionais_com_grupos,
  public.vw_etapas_agendadas,
  public.vw_blocos_ocupados,
  public.vw_servicos_n8n
to authenticated;

grant select on
  public.vw_comanda_item_etapas_completas,
  public.vw_agendamentos_completos,
  public.vw_servicos_com_etapas,
  public.vw_profissionais_com_grupos,
  public.vw_etapas_agendadas,
  public.vw_blocos_ocupados,
  public.vw_servicos_n8n
to service_role;
