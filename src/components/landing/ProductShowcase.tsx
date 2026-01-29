import { useState } from "react";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "dashboard", label: "Dashboard", emoji: "📊" },
  { id: "agenda", label: "Agendamentos", emoji: "📅" },
  { id: "clientes", label: "Clientes", emoji: "👥" },
  { id: "financeiro", label: "Financeiro", emoji: "💰" },
];

const ProductShowcase = () => {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <section className="py-24 relative overflow-hidden bg-muted/30">
      <div className="absolute inset-0 bg-grid-pattern opacity-20" />
      
      <div className="container mx-auto px-4 relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center rounded-full border px-4 py-2 mb-6 text-sm font-semibold bg-primary/10 text-primary border-primary/30">
              <span className="mr-2">📊</span>
              Conheça o Sistema
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-foreground mb-4">
              Veja o Foguete em <span className="text-gradient-primary">ação</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Interface intuitiva e moderna para você gerenciar tudo em um só lugar
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all duration-300",
                  activeTab === tab.id
                    ? "bg-primary text-primary-foreground shadow-lg"
                    : "bg-card hover:bg-muted text-muted-foreground hover:text-foreground border"
                )}
              >
                <span>{tab.emoji}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative">
            <div className="bg-card rounded-2xl shadow-2xl border overflow-hidden max-w-4xl mx-auto">
              <div className="bg-muted/50 px-4 py-3 flex items-center gap-2 border-b">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="bg-background rounded-md px-4 py-1 text-xs text-muted-foreground">
                    sistemafoguete.com.br/{activeTab}
                  </div>
                </div>
              </div>

              <div className="p-6 min-h-[400px]">
                {activeTab === "dashboard" && <DashboardMockup key="dashboard" />}
                {activeTab === "agenda" && <AgendaMockup key="agenda" />}
                {activeTab === "clientes" && <ClientesMockup key="clientes" />}
                {activeTab === "financeiro" && <FinanceiroMockup key="financeiro" />}
              </div>
            </div>

            <div className="hidden md:block absolute -z-10 top-10 -left-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />
            <div className="hidden md:block absolute -z-10 bottom-10 -right-20 w-40 h-40 bg-accent/20 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </section>
  );
};

const DashboardMockup = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[
        { emoji: "📅", value: "24", label: "Agendamentos Hoje", color: "from-blue-500 to-cyan-500", change: "+5" },
        { emoji: "👥", value: "156", label: "Clientes Ativos", color: "from-purple-500 to-pink-500", change: "+12" },
        { emoji: "💰", value: "R$ 4.580", label: "Receita do Mês", color: "from-emerald-500 to-teal-500", change: "+23%" },
        { emoji: "⭐", value: "4.9", label: "Avaliação Média", color: "from-orange-500 to-amber-500", change: "" },
      ].map((stat, i) => (
        <div
          key={i}
          className="bg-muted/50 rounded-xl p-4 animate-scale-in"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className={`w-10 h-10 mb-3 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
            <span className="text-lg">{stat.emoji}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">{stat.value}</span>
            {stat.change && <span className="text-xs text-emerald-500 font-medium">{stat.change}</span>}
          </div>
          <div className="text-sm text-muted-foreground">{stat.label}</div>
        </div>
      ))}
    </div>

    <div className="bg-muted/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground">Receita Semanal</h3>
        <span className="text-sm text-emerald-500">+18% vs semana passada</span>
      </div>
      <div className="flex items-end gap-2 h-32">
        {[45, 72, 58, 85, 62, 95, 78].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-gradient-to-t from-primary to-primary/50 rounded-t-md animate-scale-in"
            style={{ 
              height: `${h}%`,
              animationDelay: `${300 + i * 50}ms`
            }}
          />
        ))}
      </div>
    </div>
  </div>
);

const AgendaMockup = () => (
  <div className="space-y-4 animate-fade-in">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-foreground">Terça-feira, 10 de Janeiro</h3>
      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-secondary text-secondary-foreground">8 agendamentos</span>
    </div>
    
    <div className="grid gap-3">
      {[
        { time: "09:00", name: "Maria Silva", service: "Corte + Escova", duration: "1h", status: "confirmed", price: "R$ 120" },
        { time: "10:30", name: "João Santos", service: "Barba Completa", duration: "45min", status: "confirmed", price: "R$ 80" },
        { time: "11:30", name: "Ana Costa", service: "Coloração", duration: "2h", status: "pending", price: "R$ 250" },
        { time: "14:00", name: "Pedro Oliveira", service: "Corte Masculino", duration: "30min", status: "confirmed", price: "R$ 50" },
        { time: "15:00", name: "Carla Mendes", service: "Manicure + Pedicure", duration: "1h30", status: "confirmed", price: "R$ 100" },
      ].map((apt, i) => (
        <div
          key={i}
          className="flex items-center gap-4 bg-muted/50 rounded-xl p-4 animate-fade-in"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="text-center">
            <div className="text-lg font-bold text-primary">{apt.time}</div>
            <div className="text-xs text-muted-foreground">{apt.duration}</div>
          </div>
          <div className="flex-1">
            <div className="font-medium text-foreground">{apt.name}</div>
            <div className="text-sm text-muted-foreground">{apt.service}</div>
          </div>
          <div className="text-right">
            <div className="font-semibold text-foreground">{apt.price}</div>
            <div className={`text-xs ${apt.status === 'confirmed' ? 'text-emerald-500' : 'text-yellow-500'}`}>
              {apt.status === 'confirmed' ? '✓ Confirmado' : '⏳ Pendente'}
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

const ClientesMockup = () => (
  <div className="space-y-4 animate-fade-in">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold text-foreground">Seus Clientes</h3>
      <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold bg-secondary text-secondary-foreground">156 clientes</span>
    </div>
    
    <div className="grid gap-3">
      {[
        { name: "Maria Silva", phone: "(48) 99999-1234", visits: 24, lastVisit: "Hoje", loyalty: 8 },
        { name: "João Santos", phone: "(48) 99999-5678", visits: 18, lastVisit: "3 dias", loyalty: 6 },
        { name: "Ana Costa", phone: "(48) 99999-9012", visits: 32, lastVisit: "1 semana", loyalty: 10 },
        { name: "Pedro Oliveira", phone: "(48) 99999-3456", visits: 15, lastVisit: "2 semanas", loyalty: 5 },
      ].map((client, i) => (
        <div
          key={i}
          className="flex items-center gap-4 bg-muted/50 rounded-xl p-4 animate-fade-in"
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center text-white font-bold">
            {client.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="flex-1">
            <div className="font-medium text-foreground">{client.name}</div>
            <div className="text-sm text-muted-foreground">{client.phone}</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-foreground">{client.visits}</div>
            <div className="text-xs text-muted-foreground">visitas</div>
          </div>
          <div className="flex gap-0.5">
            {[...Array(10)].map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full ${idx < client.loyalty ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const FinanceiroMockup = () => (
  <div className="space-y-4 animate-fade-in">
    <div className="grid grid-cols-3 gap-4">
      {[
        { label: "Receitas", value: "R$ 12.450", color: "text-emerald-500", bg: "bg-emerald-500/10" },
        { label: "Despesas", value: "R$ 3.200", color: "text-red-500", bg: "bg-red-500/10" },
        { label: "Lucro", value: "R$ 9.250", color: "text-primary", bg: "bg-primary/10" },
      ].map((item, i) => (
        <div
          key={i}
          className={`${item.bg} rounded-xl p-4 text-center animate-scale-in`}
          style={{ animationDelay: `${i * 100}ms` }}
        >
          <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
          <div className="text-sm text-muted-foreground">{item.label}</div>
        </div>
      ))}
    </div>

    <div className="bg-muted/30 rounded-xl p-4">
      <h4 className="font-semibold text-foreground mb-4">Últimas Transações</h4>
      <div className="space-y-3">
        {[
          { desc: "Corte + Escova - Maria Silva", value: "+R$ 120", type: "income", method: "PIX" },
          { desc: "Produtos de beleza", value: "-R$ 450", type: "expense", method: "Cartão" },
          { desc: "Barba Completa - João Santos", value: "+R$ 80", type: "income", method: "Dinheiro" },
          { desc: "Coloração - Ana Costa", value: "+R$ 250", type: "income", method: "PIX" },
        ].map((tx, i) => (
          <div
            key={i}
            className="flex items-center justify-between py-2 border-b border-border/50 last:border-0 animate-fade-in"
            style={{ animationDelay: `${300 + i * 100}ms` }}
          >
            <div>
              <div className="text-sm font-medium text-foreground">{tx.desc}</div>
              <div className="text-xs text-muted-foreground">{tx.method}</div>
            </div>
            <div className={`font-semibold ${tx.type === 'income' ? 'text-emerald-500' : 'text-red-500'}`}>
              {tx.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default ProductShowcase;