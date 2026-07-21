# Operação e observabilidade

## Eventos

APIs críticas emitem JSON por `src/lib/observability.ts`. Todo evento contém `event`, `route`, `status` e `requestId`; unidade, integração e classe/código de erro são opcionais. O logger usa allowlist e não aceita token, autorização, cookie, senha, segredo, chave, e-mail, telefone, CPF ou payload.

Encaminhe stdout/stderr para o provedor de logs do ambiente. Correlacione solicitações pelo header `x-request-id`; quando ausente, o servidor gera UUID. Nunca grave corpo de webhook ou dados pessoais para diagnóstico.

## Alertas mínimos

- `auth.failure` ou aumento de `auth.rejected`: revisar disponibilidade do Auth e tentativas indevidas.
- eventos `appointment.*_failure`: revisar conflitos, banco e configuração da unidade.
- `integration.*_failure` ou `integration.config_missing`: revisar n8n/WhatsApp sem registrar credenciais.
- HTTP 409: acompanhar concorrência; é resposta de domínio esperada, não falha interna.
- HTTP 5xx: alertar por taxa e rota, mantendo `requestId` para investigação.

## Rotação e incidentes

Segredos pertencem ao gerenciador do ambiente, nunca ao repositório ou aos logs. Após rotação, execute `npm run verify:key-rotation` somente em um ambiente local configurado com credenciais não expostas. Em incidente: revogue a credencial no provedor, substitua-a no runtime, valide 401/403/2xx e monitore 24–48h.

## Verificação local

Execute `npm run verify` para checagens estáticas e `npm run test:public-quality` para acessibilidade/responsividade pública. Testes autenticados exigem contas descartáveis fornecidas apenas por variáveis de ambiente.
