import { redirect } from 'next/navigation';

// Módulo desativado — redireciona para o dashboard
export default function ContasReceberPage() {
  redirect('/admin/dashboard');
}
