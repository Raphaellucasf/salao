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
              <p className="text-primary-100 text-xs mb-1">Receita Hoje</p>
              <p className="text-2xl font-bold">R$ {stats.todayRevenue}</p>
              <p className="text-primary-100 text-xs mt-1">comissão estimada</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 -mt-4">
        {/* Date Selector */}
        <Card padding="md" className="mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-primary-600" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border-0 p-0 focus:ring-0 font-semibold"
              />
            </div>
            <Button
              variant="accent"
              size="sm"
              onClick={() => setShowBlockModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              Bloquear
            </Button>
          </div>
        </Card>

        {/* Appointments List */}
        <div className="space-y-3">
          <h2 className="font-semibold text-neutral-900 px-1">Agendamentos de Hoje</h2>
          
          {todayAppointments.map((appointment) => (
            <Card key={appointment.id} padding="md" hover>
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-neutral-900">{appointment.client}</h3>
                      <Badge variant={
                        appointment.status === 'confirmed' ? 'success' :
                        appointment.status === 'pending' ? 'warning' :
                        appointment.status === 'completed' ? 'default' :
                        'error'
                      }>
                        {appointment.status === 'confirmed' ? 'Confirmado' :
                         appointment.status === 'pending' ? 'Pendente' :
                         appointment.status === 'completed' ? 'Concluído' :
                         'Cancelado'}
                      </Badge>
                    </div>
                    <p className="text-sm text-neutral-600 mb-2">{appointment.service}</p>
                    <div className="flex items-center space-x-4 text-xs text-neutral-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>{appointment.time}</span>
                      </span>
                      <span>{appointment.duration} min</span>
                    </div>
                  </div>
                </div>
                {appointment.status === 'confirmed' && (
                  <Button variant="ghost" size="sm">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {todayAppointments.length === 0 && (
          <Card padding="lg" className="text-center">
            <div className="py-8">
              <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-neutral-400" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Nenhum agendamento</h3>
              <p className="text-neutral-600 text-sm">Você não tem agendamentos para este dia.</p>
            </div>
          </Card>
        )}
      </main>

      {/* Block Time Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card padding="lg" className="w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-neutral-900">Bloquear Horário</h3>
              <button onClick={() => setShowBlockModal(false)}>
                <X className="w-6 h-6 text-neutral-400" />
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="Data"
                type="date"
                defaultValue={selectedDate}
              />
              <Input
                label="Horário Início"
                type="time"
              />
              <Input
                label="Horário Fim"
                type="time"
              />
              <Input
                label="Motivo (opcional)"
                placeholder="Ex: Almoço, Compromisso pessoal..."
              />
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowBlockModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => {
                    // Aqui você salvaria o bloqueio no banco
                    alert('Horário bloqueado!');
                    setShowBlockModal(false);
                  }}
                >
                  Confirmar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-around">
          <button className="flex flex-col items-center space-y-1 text-primary-600">
            <Calendar className="w-6 h-6" />
            <span className="text-xs font-medium">Agenda</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-neutral-400">
            <DollarSign className="w-6 h-6" />
            <span className="text-xs">Financeiro</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-neutral-400">
            <Users className="w-6 h-6" />
            <span className="text-xs">Clientes</span>
          </button>
          <button className="flex flex-col items-center space-y-1 text-neutral-400">
            <Settings className="w-6 h-6" />
            <span className="text-xs">Perfil</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

// Importações faltantes
import { DollarSign, Users, Settings } from 'lucide-react';
