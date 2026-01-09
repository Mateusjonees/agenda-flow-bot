import { useState, useRef, useCallback, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, FileText, MoreVertical, Pencil, Trash2, Plus, Calendar, ClipboardList, CreditCard, Maximize2, Minimize2, GripVertical, User, X, ListTodo, CalendarPlus } from "lucide-react";
import { CustomerHistory } from "./CustomerHistory";
import { CustomerSubscriptions } from "./CustomerSubscriptions";
import { CustomerLoyalty } from "./CustomerLoyalty";
import { CustomerDocuments } from "./CustomerDocuments";
import { useIsMobile } from "@/hooks/use-mobile";

interface Customer {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address?: string | null;
  notes: string | null;
  source: string | null;
  cpf: string | null;
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
  isReadOnly?: boolean;
}

const getSourceLabel = (source: string | null): string => {
  switch (source) {
    case 'whatsapp': return 'WhatsApp';
    case 'website': return 'Site';
    case 'referral': return 'Indicação';
    case 'social_media': return 'Redes Sociais';
    case 'other': return 'Outro';
    default: return source || 'Não informado';
  }
};

const tabLabels: Record<string, string> = {
  info: "Informações",
  history: "Histórico",
  subscriptions: "Assinaturas",
  loyalty: "Fidelidade"
};

const MIN_WIDTH = 400;
const DEFAULT_WIDTH = 650;

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
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const [isResizing, setIsResizing] = useState(false);

  // Reset states when sheet closes
  useEffect(() => {
    if (!open) {
      setIsExpanded(false);
      setWidth(DEFAULT_WIDTH);
    }
  }, [open]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (isMobile) return;
    e.preventDefault();
    setIsResizing(true);
  }, [isMobile]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= MIN_WIDTH && newWidth <= window.innerWidth) {
        setWidth(newWidth);
        setIsExpanded(false);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const toggleExpand = () => {
    if (isExpanded) {
      setIsExpanded(false);
      setWidth(DEFAULT_WIDTH);
    } else {
      setIsExpanded(true);
    }
  };

  if (!customer) return null;

  const sheetWidth = isMobile 
    ? "w-full" 
    : isExpanded 
      ? "w-full" 
      : undefined;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className={`p-0 flex flex-col gap-0 [&>button]:hidden transition-all duration-200 sm:max-w-none ${sheetWidth || ''}`}
        style={!isMobile && !isExpanded ? { width: `${width}px`, maxWidth: '100vw' } : undefined}
      >
        {/* Resize handle - apenas desktop e quando sheet está aberto */}
        {!isMobile && open && (
          <div
            onMouseDown={handleMouseDown}
            className={`absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 transition-colors z-20 ${isResizing ? 'bg-primary/30' : 'bg-transparent'}`}
            title="Arraste para redimensionar"
          />
        )}

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
            <div className="flex items-center gap-1">
              {/* Botão expandir/minimizar - apenas desktop */}
              {!isMobile && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleExpand}
                  className="h-8 w-8"
                  title={isExpanded ? "Minimizar" : "Expandir"}
                >
                  {isExpanded ? (
                    <Minimize2 className="h-4 w-4" />
                  ) : (
                    <Maximize2 className="h-4 w-4" />
                  )}
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 flex-shrink-0"
                onClick={() => onOpenChange(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
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
