import { redirect } from 'next/navigation';

// Modulo desativado - redireciona para o dashboard
export default function DebitosPage() {
  redirect('/admin/dashboard');
}
