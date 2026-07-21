/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

const auth = read('src/lib/api-auth.ts');
for (const fragment of ['apiError(', 'getRequestId(', 'logSecurityEvent(', "event: 'auth."]) {
  assert(auth.includes(fragment), `autorização deve conter ${fragment}`);
}

const appointments = read('src/app/api/appointments/route.ts');
for (const event of ['appointment.conflict_check_failure', 'integration.webhook_failure', 'appointment.create_failure']) {
  assert(appointments.includes(event), `agendamentos deve observar ${event}`);
}

const whatsapp = read('src/app/api/whatsapp/agendar/route.ts');
assert(!whatsapp.includes("from('webhook_log')"), 'webhook não deve persistir payload bruto');
assert(whatsapp.includes('logSecurityEvent('), 'webhook deve usar logger seguro');

const docs = read('docs/operations/OBSERVABILITY.md');
for (const required of ['x-request-id', '24–48h', 'Nunca grave corpo de webhook']) {
  assert(docs.includes(required), `runbook deve conter ${required}`);
}

console.log('OK: contratos de API e observabilidade crítica validados.');
