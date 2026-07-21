console.error(
  'Script desativado: políticas RLS não devem ser ampliadas por um utilitário local. ' +
  'Use uma migração revisada, versionada e homologada para qualquer alteração de RLS.'
);
process.exitCode = 1;
