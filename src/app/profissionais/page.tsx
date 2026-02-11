import ProfessionalDashboard from '@/components/profissionais/Dashboard';
import BottomNav from '@/components/layout/BottomNav';
import Sidebar from '@/components/layout/Sidebar';

export default function ProfessionalAppPage() {
  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar userRole="professional" />
      
      <main className="flex-1">
        <ProfessionalDashboard />
      </main>

      <BottomNav userRole="professional" />
    </div>
  );
}
