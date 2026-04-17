import { redirect } from 'next/navigation';

// Módulo desativado — redireciona para o dashboard
export default function ChequesPage() {
  redirect('/admin/dashboard');
}
