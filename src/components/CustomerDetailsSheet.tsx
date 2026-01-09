import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, Mail, FileText, MoreVertical, Pencil, Trash2, ListTodo, CalendarPlus, CreditCard, X } from "lucide-react";
import { CustomerSubscriptions } from "@/components/CustomerSubscriptions";
import { CustomerHistory } from "@/components/CustomerHistory";
import { CustomerDocuments } from "@/components/CustomerDocuments";
import { CustomerLoyalty } from "@/components/CustomerLoyalty";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  cpf: string | null;
  notes: string | null;
  source: string | null;
  created_at: string;
}

interface CustomerDetailsSheetProps {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTab: string;
  onTabChange: (tab: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onNewTask: () => void;
  onNewAppointment: () => void;
  onNewProposal: () => void;
  onNewSubscription: () => void;
  isReadOnly: boolean;
}

const getSourceLabel = (source: string | null) => {
  const sources: Record<string, string> = {
    indicacao: 'Indicação',
    facebook: 'Facebook',
    instagram: 'Instagram',
    google: 'Google',
    whatsapp: 'WhatsApp',
    site: 'Site',
    outdoor: 'Outdoor/Placa',
    panfleto: 'Panfleto',
    radio: 'Rádio',
    outro: 'Outro'
  };
  return source ? sources[source] || source : null;
};

const tabLabels: Record<string, string> = {
  info: "Informações",
  history: "Histórico",
  subscriptions: "Assinaturas",
  loyalty: "Fidelidade"
};

export const CustomerDetailsSheet = ({
  customer,
  open,
  onOpenChange,
  selectedTab,
  onTabChange,
  onEdit,
  onDelete,
  onNewTask,
  onNewAppointment,
  onNewProposal,
  onNewSubscription,
  isReadOnly
}: CustomerDetailsSheetProps) => {
  if (!customer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:w-[540px] md:w-[600px] lg:w-[650px] p-0 flex flex-col gap-0 [&>button]:hidden"
      >
        {/* Header compacto */}
        <SheetHeader className="px-4 py-3 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <SheetTitle className="text-base font-semibold truncate">
                  {customer.name}
                </SheetTitle>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Phone className="w-3 h-3" />
                  {customer.phone}
                </p>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 flex-shrink-0"
              onClick={() => onOpenChange(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Navegação e Ações */}
          <div className="flex items-center gap-2 mt-3">
            <Select value={selectedTab} onValueChange={onTabChange}>
              <SelectTrigger className="flex-1 h-9 text-sm">
                <SelectValue>{tabLabels[selectedTab]}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Informações</SelectItem>
                <SelectItem value="history">Histórico</SelectItem>
                <SelectItem value="subscriptions">Assinaturas</SelectItem>
                <SelectItem value="loyalty">Fidelidade</SelectItem>
              </SelectContent>
            </Select>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-9 gap-1.5">
                  <MoreVertical className="w-4 h-4" />
                  <span className="hidden sm:inline">Ações</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onEdit} disabled={isReadOnly}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Editar Cliente
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onNewTask} disabled={isReadOnly}>
                  <ListTodo className="w-4 h-4 mr-2" />
                  Nova Tarefa
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onNewAppointment} disabled={isReadOnly}>
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Novo Agendamento
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onNewProposal} disabled={isReadOnly}>
                  <FileText className="w-4 h-4 mr-2" />
                  Nova Proposta
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onNewSubscription} disabled={isReadOnly}>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Nova Assinatura
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={onDelete} 
                  disabled={isReadOnly}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir Cliente
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </SheetHeader>

        {/* Conteúdo scrollável */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedTab === "info" && (
            <div className="space-y-4">
              {/* Card de informações de contato */}
              <Card>
                <CardHeader className="p-4 pb-3">
                  <CardTitle className="text-sm font-medium">Informações de Contato</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-0 space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Telefone</p>
                      <p className="font-medium">{customer.phone}</p>
                    </div>
                  </div>
                  
                  {customer.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">E-mail</p>
                        <p className="font-medium break-all">{customer.email}</p>
                      </div>
                    </div>
                  )}

                  {customer.cpf && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">CPF</p>
                        <p className="font-medium">{customer.cpf}</p>
                      </div>
                    </div>
                  )}

                  {customer.source && (
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Origem</p>
                        <p className="font-medium">{getSourceLabel(customer.source)}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Observações */}
              {customer.notes && (
                <Card>
                  <CardHeader className="p-4 pb-3">
                    <CardTitle className="text-sm font-medium">Observações</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {customer.notes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Documentos anexados */}
              <CustomerDocuments customerId={customer.id} />
            </div>
          )}

          {selectedTab === "history" && (
            <CustomerHistory customerId={customer.id} />
          )}

          {selectedTab === "subscriptions" && (
            <CustomerSubscriptions customerId={customer.id} />
          )}

          {selectedTab === "loyalty" && (
            <CustomerLoyalty customerId={customer.id} />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
