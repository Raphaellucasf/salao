alter table public.orcamentos enable row level security;
alter table public.orcamento_itens enable row level security;
alter table public.avisos_clientes enable row level security;
alter table public.cliente_saldos enable row level security;
alter table public.cadastros_excluidos enable row level security;
alter table public.cadastro_templates enable row level security;
alter table public.profissional_horarios enable row level security;
alter table public.agendamentos_blocos enable row level security;
alter table public.estoque_alertas enable row level security;
alter table public.pacotes_servicos_itens enable row level security;
alter table public.roles enable row level security;
alter table public.promocoes enable row level security;
alter table public.configuracoes_sistema enable row level security;
alter table public.formas_pagamento enable row level security;
alter table public.faq_estabelecimento enable row level security;

revoke all privileges on
  public.orcamentos, public.orcamento_itens, public.avisos_clientes,
  public.cliente_saldos, public.cadastros_excluidos, public.cadastro_templates,
  public.profissional_horarios, public.agendamentos_blocos, public.estoque_alertas,
  public.pacotes_servicos_itens, public.roles, public.promocoes,
  public.configuracoes_sistema, public.formas_pagamento, public.faq_estabelecimento
from public, anon, authenticated;

grant select, insert, update, delete on
  public.orcamentos, public.orcamento_itens, public.avisos_clientes,
  public.cliente_saldos, public.cadastros_excluidos, public.cadastro_templates,
  public.profissional_horarios, public.agendamentos_blocos, public.estoque_alertas,
  public.pacotes_servicos_itens, public.roles, public.promocoes,
  public.configuracoes_sistema, public.formas_pagamento, public.faq_estabelecimento
to authenticated;

grant all privileges on
  public.orcamentos, public.orcamento_itens, public.avisos_clientes,
  public.cliente_saldos, public.cadastros_excluidos, public.cadastro_templates,
  public.profissional_horarios, public.agendamentos_blocos, public.estoque_alertas,
  public.pacotes_servicos_itens, public.roles, public.promocoes,
  public.configuracoes_sistema, public.formas_pagamento, public.faq_estabelecimento
to service_role;

drop policy if exists orcamentos_admin_all on public.orcamentos;
create policy orcamentos_admin_all on public.orcamentos for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists orcamento_itens_admin_all on public.orcamento_itens;
create policy orcamento_itens_admin_all on public.orcamento_itens for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists avisos_clientes_admin_all on public.avisos_clientes;
create policy avisos_clientes_admin_all on public.avisos_clientes for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists cliente_saldos_admin_all on public.cliente_saldos;
create policy cliente_saldos_admin_all on public.cliente_saldos for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists cadastros_excluidos_admin_all on public.cadastros_excluidos;
create policy cadastros_excluidos_admin_all on public.cadastros_excluidos for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists cadastro_templates_admin_all on public.cadastro_templates;
create policy cadastro_templates_admin_all on public.cadastro_templates for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists profissional_horarios_admin_all on public.profissional_horarios;
create policy profissional_horarios_admin_all on public.profissional_horarios for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists agendamentos_blocos_admin_all on public.agendamentos_blocos;
create policy agendamentos_blocos_admin_all on public.agendamentos_blocos for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists estoque_alertas_admin_all on public.estoque_alertas;
create policy estoque_alertas_admin_all on public.estoque_alertas for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists pacotes_servicos_itens_admin_all on public.pacotes_servicos_itens;
create policy pacotes_servicos_itens_admin_all on public.pacotes_servicos_itens for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists roles_admin_all on public.roles;
create policy roles_admin_all on public.roles for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists promocoes_admin_all on public.promocoes;
create policy promocoes_admin_all on public.promocoes for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists configuracoes_sistema_admin_all on public.configuracoes_sistema;
create policy configuracoes_sistema_admin_all on public.configuracoes_sistema for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists formas_pagamento_admin_all on public.formas_pagamento;
create policy formas_pagamento_admin_all on public.formas_pagamento for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));

drop policy if exists faq_estabelecimento_admin_all on public.faq_estabelecimento;
create policy faq_estabelecimento_admin_all on public.faq_estabelecimento for all to authenticated
  using ((select public.is_authenticated_admin())) with check ((select public.is_authenticated_admin()));
