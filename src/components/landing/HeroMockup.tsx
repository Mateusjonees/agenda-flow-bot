import { memo } from "react";
import { Calendar, Users, DollarSign, TrendingUp, Bell, CheckCircle2 } from "lucide-react";

const HeroMockup = memo(() => {
  return (
    <div className="relative animate-fade-in">
      {/* Main Dashboard Card */}
      <div className="relative bg-card rounded-2xl shadow-2xl border overflow-hidden">
        {/* Browser Header */}
        <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 flex justify-center">
            <div className="bg-background rounded-md px-4 py-1 text-xs text-muted-foreground">
              sistemafoguete.com.br/dashboard
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="p-4 space-y-4">
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Calendar, value: "24", label: "Hoje", color: "from-blue-500 to-cyan-500" },
              { icon: Users, value: "156", label: "Clientes", color: "from-purple-500 to-pink-500" },
              { icon: DollarSign, value: "R$ 4.580", label: "Receita", color: "from-emerald-500 to-teal-500" },
              { icon: TrendingUp, value: "+23%", label: "Crescimento", color: "from-orange-500 to-amber-500" },
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl p-3 text-center animate-fade-in"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className={`w-8 h-8 mx-auto mb-2 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-4 h-4 text-white" />
                </div>
                <div className="text-sm font-bold text-foreground">{stat.value}</div>
                <div className="text-[10px] text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Appointments Preview - Hidden on very small screens for performance */}
          <div className="bg-muted/30 rounded-xl p-3 hidden sm:block">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-foreground">Próximos Agendamentos</span>
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <div className="space-y-2">
              {[
                { time: "09:00", name: "Maria Silva", service: "Corte + Escova", status: "confirmed" },
                { time: "10:30", name: "João Santos", service: "Barba Completa", status: "pending" },
                { time: "14:00", name: "Ana Costa", service: "Manicure", status: "confirmed" },
              ].map((apt, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 bg-background/50 rounded-lg p-2"
                >
                  <div className="text-xs font-mono font-semibold text-primary">{apt.time}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-foreground truncate">{apt.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{apt.service}</div>
                  </div>
                  <CheckCircle2 className={`w-4 h-4 ${apt.status === 'confirmed' ? 'text-emerald-500' : 'text-yellow-500'}`} />
                </div>
              ))}
            </div>
          </div>

          {/* Revenue Chart Preview */}
          <div className="bg-muted/30 rounded-xl p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-foreground">Receita Semanal</span>
              <div className="text-[10px] text-emerald-500 font-medium">+18% vs semana passada</div>
            </div>
            <div className="flex items-end gap-1 h-16">
              {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t-md transition-all duration-500"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between mt-2 text-[8px] text-muted-foreground">
              {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Notification - Hidden on mobile for performance */}
      <div className="absolute -left-6 top-1/4 bg-card rounded-xl shadow-xl border p-3 max-w-[180px] hidden lg:block animate-fade-in" style={{ animationDelay: "500ms" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div>
            <div className="text-[10px] font-semibold text-foreground">Pagamento Confirmado</div>
            <div className="text-[9px] text-muted-foreground">R$ 150,00 via PIX</div>
          </div>
        </div>
      </div>

      {/* Floating WhatsApp - Hidden on mobile for performance */}
      <div className="absolute -right-4 bottom-1/4 bg-card rounded-xl shadow-xl border p-3 max-w-[160px] hidden lg:block animate-fade-in" style={{ animationDelay: "700ms" }}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#25D366]/20 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-semibold text-foreground">Lembrete Enviado</div>
            <div className="text-[9px] text-muted-foreground">Maria Silva - 09:00</div>
          </div>
        </div>
      </div>
    </div>
  );
});

HeroMockup.displayName = "HeroMockup";

export default HeroMockup;
