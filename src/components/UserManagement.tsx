import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserPlus, Shield, Loader2, Crown, CreditCard, QrCode, DollarSign, Clock, AlertTriangle } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { ASSIGNABLE_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, UserRole } from "@/config/permissions";
import { UserSeatPaymentDialog } from "./UserSeatPaymentDialog";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  isOwner: boolean;
  is_paid?: boolean;
  next_payment_due?: string | null;
  daysRemaining?: number | null;
}

interface PaymentData {
  id: string;
  qr_code: string;
  qr_code_base64?: string;
  amount: number;
  pending_email: string;
  pending_name: string;
  expires_at: string;
}

const USER_SEAT_PRICE = 19.00;

/**
 * Componente de Gerenciamento de Usuários
 * Permite que admins criem, editem e removam usuários e suas permissões
 * 
 * PROTEÇÕES:
 * - O dono da conta (owner) não pode ser excluído
 * - O usuário logado não pode excluir a si mesmo
 * - Apenas admins podem acessar este componente
 * - Novos usuários requerem pagamento de R$19/mês
 */
export function UserManagement() {
  const queryClient = useQueryClient();
  const { isAdmin } = useUserRole();
  
  // Estados para o modal de novo usuário
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("seller");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "card">("pix");
  
  // Estado para modal de pagamento PIX
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Buscar usuários com suas roles
  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users-with-roles'],
    queryFn: async () => {
      // Buscar usuário atual
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Buscar o dono da conta (quem tem business_settings)
      const { data: businessSettings } = await supabase
        .from('business_settings')
        .select('user_id')
        .single();
      
      const ownerId = businessSettings?.user_id;
      
      // Buscar todas as roles com campos de pagamento
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at, created_by, is_paid, next_payment_due');
      
      if (rolesError) throw rolesError;
      
      // Buscar perfis correspondentes (agora com email)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email');
      
      if (profilesError) throw profilesError;
      
      // Combinar dados
      const usersWithRoles: UserWithRole[] = roles?.map(role => {
        const profile = profiles?.find(p => p.id === role.user_id);
        const isOwner = role.user_id === ownerId;
        const isTeamMember = role.created_by !== null;
        
        // Email: usar do profile se disponível, senão do currentUser se for o mesmo, senão N/A
        let email = 'N/A';
        if (profile?.email) {
          email = profile.email;
        } else if (role.user_id === currentUser?.id && currentUser?.email) {
          email = currentUser.email;
        }

        // Calcular dias restantes para colaboradores
        let daysRemaining: number | null = null;
        if (isTeamMember && role.next_payment_due) {
          const nextDue = new Date(role.next_payment_due);
          const now = new Date();
          daysRemaining = Math.max(0, Math.ceil((nextDue.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        }
        
        return {
          id: role.user_id,
          email,
          full_name: profile?.full_name || null,
          role: role.role as UserRole,
          created_at: role.created_at || new Date().toISOString(),
          isOwner,
          is_paid: isTeamMember ? role.is_paid : undefined,
          next_payment_due: role.next_payment_due,
          daysRemaining,
        };
      }) || [];
      
      // Ordenar: owner primeiro, depois por data de criação
      usersWithRoles.sort((a, b) => {
        if (a.isOwner) return -1;
        if (b.isOwner) return 1;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });
      
      return {
        users: usersWithRoles,
        currentUserId: currentUser?.id,
        ownerId,
      };
    },
    enabled: isAdmin,
  });

  const users = usersData?.users;
  const currentUserId = usersData?.currentUserId;

  // Mutation para atualizar role
  const updateRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const { error } = await supabase
        .from('user_roles')
        .update({ role })
        .eq('user_id', userId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      setEditingUser(null);
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error("Erro ao atualizar perfil:", error);
      toast.error("Erro ao atualizar perfil");
    },
  });

  // Mutation para remover usuário
  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Remover role primeiro
      const { error: roleError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId);
      
      if (roleError) throw roleError;
      
      // Nota: Não podemos deletar o usuário do auth sem acesso admin
      // O usuário perde o acesso quando sua role é removida
    },
    onSuccess: () => {
      toast.success("Usuário removido com sucesso!");
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
    },
    onError: (error: Error) => {
      console.error("Erro ao remover usuário:", error);
      toast.error("Erro ao remover usuário");
    },
  });

  const resetForm = () => {
    setNewEmail("");
    setNewName("");
    setNewPassword("");
    setNewRole("seller");
    setPaymentMethod("pix");
    setEditingUser(null);
  };

  // Gerar pagamento PIX para novo usuário
  const handleGeneratePixPayment = async () => {
    if (!newEmail || !newName || !newPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Não autenticado");

      const response = await supabase.functions.invoke("generate-user-seat-pix", {
        body: {
          email: newEmail,
          name: newName,
          password: newPassword,
          role: newRole,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao gerar PIX");
      }

      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.error || "Erro ao gerar PIX");
      }

      // Mostrar modal de pagamento PIX
      setPaymentData(data.payment);
      setIsDialogOpen(false);
      setPaymentDialogOpen(true);
      
    } catch (error: any) {
      console.error("Erro ao gerar PIX:", error);
      
      // Mensagens de erro mais amigáveis
      if (error.message?.includes("já está cadastrado")) {
        toast.error("Este email já está cadastrado no sistema");
      } else {
        toast.error(error.message || "Erro ao gerar pagamento PIX");
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Gerar preferência de cartão para novo usuário
  const handleGenerateCardPayment = async () => {
    if (!newEmail || !newName || !newPassword) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      const response = await supabase.functions.invoke("create-user-seat-preference", {
        body: {
          email: newEmail,
          name: newName,
          password: newPassword,
          role: newRole,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro ao criar pagamento");
      }

      const data = response.data;
      
      if (!data.success) {
        throw new Error(data.error || "Erro ao criar pagamento");
      }

      // Redirecionar para checkout do Mercado Pago
      if (data.checkoutUrl) {
        setIsDialogOpen(false);
        window.open(data.checkoutUrl, "_blank");
        toast.info("Você será redirecionado para o checkout do Mercado Pago");
      }
      
    } catch (error: any) {
      console.error("Erro ao criar pagamento:", error);
      
      if (error.message?.includes("já está cadastrado")) {
        toast.error("Este email já está cadastrado no sistema");
      } else {
        toast.error(error.message || "Erro ao criar pagamento");
      }
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleSubmit = () => {
    if (editingUser) {
      updateRoleMutation.mutate({
        userId: editingUser.id,
        role: newRole,
      });
    } else {
      // Novo usuário - processar pagamento
      if (paymentMethod === "pix") {
        handleGeneratePixPayment();
      } else {
        handleGenerateCardPayment();
      }
    }
  };

  const openEditDialog = (user: UserWithRole) => {
    setEditingUser(user);
    setNewRole(user.role);
    setIsDialogOpen(true);
  };

  // Verificar se pode excluir o usuário
  const canDeleteUser = (user: UserWithRole): boolean => {
    // Não pode excluir o dono da conta
    if (user.isOwner) return false;
    // Não pode excluir a si mesmo
    if (user.id === currentUserId) return false;
    return true;
  };

  // Callback quando pagamento é confirmado
  const handlePaymentConfirmed = () => {
    setPaymentDialogOpen(false);
    setPaymentData(null);
    resetForm();
    queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
    toast.success("Usuário criado com sucesso!");
  };

  // Se não for admin, não mostra nada
  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Card>
        <CardHeader className="p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                Crie, edite e remova usuários e suas permissões
              </CardDescription>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <UserPlus className="h-4 w-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm max-h-[85vh] overflow-hidden flex flex-col">
                <DialogHeader className="pb-2">
                  <DialogTitle className="text-base">
                    {editingUser ? "Editar Perfil" : "Novo Usuário"}
                  </DialogTitle>
                  <DialogDescription className="text-xs">
                    {editingUser 
                      ? "Altere o perfil de acesso do usuário"
                      : "Preencha os dados para criar o usuário"
                    }
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-3 py-2 overflow-y-auto flex-1 pr-1">
                  {!editingUser && (
                    <>
                      <div className="space-y-1">
                        <Label htmlFor="name" className="text-xs">Nome Completo</Label>
                        <Input
                          id="name"
                          placeholder="João da Silva"
                          value={newName}
                          onChange={(e) => setNewName(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="email" className="text-xs">E-mail</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="joao@exemplo.com"
                          value={newEmail}
                          onChange={(e) => setNewEmail(e.target.value)}
                          className="h-9"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="password" className="text-xs">Senha</Label>
                        <Input
                          id="password"
                          type="password"
                          placeholder="Mínimo 6 caracteres"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="h-9"
                        />
                      </div>
                    </>
                  )}
                  
                  <div className="space-y-1">
                    <Label htmlFor="role" className="text-xs">Perfil de Acesso</Label>
                    <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                      <SelectTrigger className="h-auto min-h-9">
                        <div className="flex flex-col items-start text-left py-0.5">
                          <span className="text-sm font-medium">{ROLE_LABELS[newRole]}</span>
                          <span className="text-[10px] text-muted-foreground line-clamp-1">
                            {ROLE_DESCRIPTIONS[newRole]}
                          </span>
                        </div>
                      </SelectTrigger>
                      <SelectContent>
                        {ASSIGNABLE_ROLES.map((role) => (
                          <SelectItem key={role} value={role} className="py-2">
                            <div className="flex flex-col items-start">
                              <span className="text-sm font-medium">{ROLE_LABELS[role]}</span>
                              <span className="text-[10px] text-muted-foreground">
                                {ROLE_DESCRIPTIONS[role]}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Seção de pagamento - só para novos usuários */}
                  {!editingUser && (
                    <>
                      <Separator className="my-2" />
                      
                      <div className="rounded-md bg-muted/50 p-3 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-medium flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            Taxa Mensal
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            Por usuário adicional
                          </p>
                        </div>
                        <span className="text-base font-bold text-primary">
                          R$ {USER_SEAT_PRICE.toFixed(2).replace(".", ",")}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs">Forma de Pagamento</Label>
                        <RadioGroup
                          value={paymentMethod}
                          onValueChange={(value) => setPaymentMethod(value as "pix" | "card")}
                          className="grid grid-cols-2 gap-2"
                        >
                          <div>
                            <RadioGroupItem
                              value="pix"
                              id="pix"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="pix"
                              className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <QrCode className="h-5 w-5 mb-1" />
                              <span className="text-xs font-medium">PIX</span>
                            </Label>
                          </div>
                          <div>
                            <RadioGroupItem
                              value="card"
                              id="card"
                              className="peer sr-only"
                            />
                            <Label
                              htmlFor="card"
                              className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-2 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                            >
                              <CreditCard className="h-5 w-5 mb-1" />
                              <span className="text-xs font-medium">Cartão</span>
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </>
                  )}
                </div>
                
                <DialogFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSubmit}
                    disabled={isProcessingPayment || updateRoleMutation.isPending}
                  >
                    {(isProcessingPayment || updateRoleMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingUser 
                      ? "Salvar" 
                      : paymentMethod === "pix" 
                        ? "Gerar PIX" 
                        : "Pagar com Cartão"
                    }
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent className="p-3 sm:p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : users && users.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead className="hidden md:table-cell">Licença</TableHead>
                    <TableHead className="hidden sm:table-cell">Desde</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} className={user.isOwner ? "bg-amber-500/5" : ""}>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{user.full_name || "Sem nome"}</span>
                            {user.isOwner && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 gap-1">
                                      <Crown className="h-3 w-3" />
                                      Principal
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Conta principal (dono da assinatura)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {user.id === currentUserId && !user.isOwner && (
                              <Badge variant="outline" className="text-xs">Você</Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' || user.role === 'owner' ? 'default' : 'secondary'}>
                          {ROLE_LABELS[user.role] || user.role}
                        </Badge>
                      </TableCell>
                      
                      {/* Coluna de Licença - só para colaboradores */}
                      <TableCell className="hidden md:table-cell">
                        {user.isOwner ? (
                          <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs">
                            Plano Principal
                          </Badge>
                        ) : user.is_paid !== undefined ? (
                          <div className="flex flex-col gap-1">
                            {user.is_paid ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs gap-1 ${
                                        user.daysRemaining !== null && user.daysRemaining <= 5
                                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                                          : 'bg-green-500/10 text-green-600 border-green-500/30'
                                      }`}
                                    >
                                      <Clock className="h-3 w-3" />
                                      {user.daysRemaining !== null ? `${user.daysRemaining} dias` : 'Ativo'}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>
                                      {user.next_payment_due 
                                        ? `Expira em ${new Date(user.next_payment_due).toLocaleDateString('pt-BR')}`
                                        : 'Licença ativa'
                                      }
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30 text-xs gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                Expirada
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">—</span>
                        )}
                      </TableCell>
                      
                      <TableCell className="hidden sm:table-cell text-muted-foreground text-sm">
                        {new Date(user.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Só permite editar se não for o owner */}
                          {!user.isOwner && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          )}
                          
                          {/* Só mostra botão de excluir se pode excluir */}
                          {canDeleteUser(user) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja remover <strong>{user.full_name || user.email}</strong>?
                                    Esta ação não pode ser desfeita.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteUserMutation.mutate(user.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Remover
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          
                          {/* Tooltip para owner */}
                          {user.isOwner && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex h-9 w-9 items-center justify-center opacity-30 cursor-not-allowed">
                                    <Trash2 className="h-4 w-4" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>A conta principal não pode ser removida</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                          
                          {/* Tooltip para próprio usuário */}
                          {user.id === currentUserId && !user.isOwner && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="inline-flex h-9 w-9 items-center justify-center opacity-30 cursor-not-allowed">
                                    <Trash2 className="h-4 w-4" />
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Você não pode remover a si mesmo</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Nenhum usuário encontrado</p>
              <p className="text-sm">Clique em "Novo Usuário" para adicionar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de pagamento PIX */}
      <UserSeatPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        paymentData={paymentData}
        onPaymentConfirmed={handlePaymentConfirmed}
      />
    </>
  );
}
