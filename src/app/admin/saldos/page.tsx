import { redirect } from 'next/navigation';

// Modulo desativado - redireciona para o dashboard
export default function SaldosPage() {
  redirect('/admin/dashboard');
}
