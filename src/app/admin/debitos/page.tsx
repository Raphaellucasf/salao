import { redirect } from 'next/navigation';

// Módulo desativado — redireciona para o dashboard
export default function DebitosPage() {
  redirect('/admin/dashboard');
}
