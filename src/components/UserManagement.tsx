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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserPlus, Shield, Loader2, Crown } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { ASSIGNABLE_ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS, UserRole } from "@/config/permissions";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
  isOwner: boolean;
}

/**
 * Componente de Gerenciamento de Usuários
 * Permite que admins criem, editem e removam usuários e suas permissões
 * 
 * PROTEÇÕES:
 * - O dono da conta (owner) não pode ser excluído
 * - O usuário logado não pode excluir a si mesmo
 * - Apenas admins podem acessar este componente
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
      
      // Buscar todas as roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, created_at');
      
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
        
        // Email: usar do profile se disponível, senão do currentUser se for o mesmo, senão N/A
        let email = 'N/A';
        if (profile?.email) {
          email = profile.email;
        } else if (role.user_id === currentUser?.id && currentUser?.email) {
          email = currentUser.email;
        }
        
        return {
          id: role.user_id,
          email,
          full_name: profile?.full_name || null,
          role: role.role as UserRole,
          created_at: role.created_at || new Date().toISOString(),
          isOwner,
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

  // Mutation para criar novo usuário
  const createUserMutation = useMutation({
    mutationFn: async ({ email, name, password, role }: { email: string; name: string; password: string; role: UserRole }) => {
      // Criar usuário via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        },
      });
      
      if (authError) throw authError;
      if (!authData.user) throw new Error("Erro ao criar usuário");

      // Aguardar um pouco para garantir que o trigger criou o profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Salvar email no profile para exibição futura
      await supabase
        .from('profiles')
        .update({ email })
        .eq('id', authData.user.id);

      // Atribuir role ao usuário
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: role,
        });
      
      if (roleError) throw roleError;

      return authData.user;
    },
    onSuccess: () => {
      toast.success("Usuário criado com sucesso! Um email de confirmação foi enviado.");
      queryClient.invalidateQueries({ queryKey: ['users-with-roles'] });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      console.error("Erro ao criar usuário:", error);
      toast.error(error.message || "Erro ao criar usuário");
    },
  });

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
    setEditingUser(null);
  };

  const handleSubmit = () => {
    if (editingUser) {
      updateRoleMutation.mutate({
        userId: editingUser.id,
        role: newRole,
      });
    } else {
      if (!newEmail || !newName || !newPassword) {
        toast.error("Preencha todos os campos");
        return;
      }
      if (newPassword.length < 6) {
        toast.error("A senha deve ter no mínimo 6 caracteres");
        return;
      }
      createUserMutation.mutate({
        email: newEmail,
        name: newName,
        password: newPassword,
        role: newRole,
      });
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

  // Se não for admin, não mostra nada
  if (!isAdmin) {
    return null;
  }

  return (
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
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingUser ? "Editar Perfil" : "Novo Usuário"}
                </DialogTitle>
                <DialogDescription>
                  {editingUser 
                    ? "Altere o perfil de acesso do usuário"
                    : "Preencha os dados para criar um novo usuário"
                  }
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {!editingUser && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        placeholder="João da Silva"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-mail</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="joao@exemplo.com"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Senha</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="role">Perfil de Acesso</Label>
                  <Select value={newRole} onValueChange={(value) => setNewRole(value as UserRole)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {ASSIGNABLE_ROLES.map((role) => (
                        <SelectItem key={role} value={role}>
                          <div className="flex flex-col">
                            <span className="font-medium">{ROLE_LABELS[role]}</span>
                            <span className="text-xs text-muted-foreground">
                              {ROLE_DESCRIPTIONS[role]}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  disabled={createUserMutation.isPending || updateRoleMutation.isPending}
                >
                  {(createUserMutation.isPending || updateRoleMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingUser ? "Salvar" : "Criar Usuário"}
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
                                  Tem certeza que deseja remover o acesso de {user.full_name || user.email}?
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
                        
                        {/* Mostrar info se não pode excluir */}
                        {!canDeleteUser(user) && !user.isOwner && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="text-xs">Você</Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Você não pode excluir sua própria conta</p>
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
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum usuário cadastrado.</p>
            <p className="text-sm">Clique em "Novo Usuário" para adicionar.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
