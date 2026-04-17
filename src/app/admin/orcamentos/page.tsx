import { redirect } from 'next/navigation';

// Modulo desativado - redireciona para o dashboard
export default function OrcamentosPage() {
  redirect('/admin/dashboard');
}
