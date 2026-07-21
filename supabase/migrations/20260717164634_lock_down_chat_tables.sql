begin;

alter table public.n8n_chat_histories enable row level security;
revoke all privileges on table public.n8n_chat_histories from public, anon, authenticated;
grant all privileges on table public.n8n_chat_histories to service_role;

alter table public.chats enable row level security;
revoke all privileges on table public.chats from public, anon, authenticated;
grant all privileges on table public.chats to service_role;

alter table public.chat_messages enable row level security;
revoke all privileges on table public.chat_messages from public, anon, authenticated;
grant all privileges on table public.chat_messages to service_role;

commit;

-- Rollback não automático: identificar primeiro qual integração legítima foi afetada.
-- Conceder somente os privilégios mínimos à role dedicada; nunca restaurar ALL/TRUNCATE a anon.
