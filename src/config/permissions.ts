/**
 * Sistema de Permissões por Perfil
 * 
 * Roles disponíveis:
 * - admin: Acesso total ao sistema
 * - seller: Vendedor - acesso limitado a vendas
 * - financial: Financeiro - acesso a dados financeiros
 */

export type UserRole = 'admin' | 'seller' | 'financial' | 'owner' | 'employee' | 'viewer';

// Rotas e suas permissões
// ':readonly' indica que o usuário pode visualizar mas não editar
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  // Admin e Owner têm acesso total
  owner: ['*'],
  admin: ['*'],
  
  // Vendedor: Painel, Tarefas, Agenda, Clientes, Propostas, Assinaturas (somente leitura)
  seller: [
    '/dashboard',
    '/tarefas',
    '/agendamentos',
    '/clientes',
    '/propostas',
    '/assinaturas:readonly', // Contratos - apenas visualização
  ],
  
  // Financeiro: Painel, Financeiro, Contratos Recorrentes, Relatórios
  financial: [
    '/dashboard',
    '/financeiro',
    '/assinaturas', // Contratos Recorrentes
    '/relatorios',
  ],
  
  // Mantidos para compatibilidade
  employee: ['/dashboard', '/tarefas', '/agendamentos'],
  viewer: ['/dashboard:readonly'],
};

// Labels amigáveis para exibição
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Proprietário',
  admin: 'Administrador',
  seller: 'Vendedor',
  financial: 'Financeiro',
  employee: 'Funcionário',
  viewer: 'Visualizador',
};

// Descrições dos perfis
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  owner: 'Acesso total ao sistema, incluindo gerenciamento de usuários',
  admin: 'Acesso total ao sistema, pode criar, editar e remover usuários',
  seller: 'Acesso a Painel, Tarefas, Agenda, Clientes, Propostas. Visualiza contratos sem editar',
  financial: 'Acesso a Painel, Financeiro, Contratos Recorrentes e Relatórios',
  employee: 'Acesso básico ao sistema',
  viewer: 'Apenas visualização do painel',
};

// Roles que podem ser atribuídas pelo admin (excluindo owner)
export const ASSIGNABLE_ROLES: UserRole[] = ['admin', 'seller', 'financial'];

/**
 * Verifica se uma role tem permissão para acessar uma rota
 */
export function hasRoutePermission(role: UserRole | null, route: string): boolean {
  if (!role) return false;
  
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  
  // Admin/Owner tem acesso total
  if (permissions.includes('*')) return true;
  
  // Verifica permissão exata ou com readonly
  const normalizedRoute = route.split('?')[0]; // Remove query params
  return permissions.some(perm => {
    const permRoute = perm.replace(':readonly', '');
    return normalizedRoute === permRoute || normalizedRoute.startsWith(permRoute + '/');
  });
}

/**
 * Verifica se a permissão é somente leitura
 */
export function isReadOnly(role: UserRole | null, route: string): boolean {
  if (!role) return true;
  
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return true;
  
  // Admin/Owner nunca é readonly
  if (permissions.includes('*')) return false;
  
  const normalizedRoute = route.split('?')[0];
  return permissions.some(perm => {
    const permRoute = perm.replace(':readonly', '');
    return perm.includes(':readonly') && 
           (normalizedRoute === permRoute || normalizedRoute.startsWith(permRoute + '/'));
  });
}

/**
 * Retorna as rotas permitidas para uma role (para filtrar menu)
 */
export function getAllowedRoutes(role: UserRole | null): string[] {
  if (!role) return [];
  
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return [];
  
  // Admin/Owner - retorna todas as rotas possíveis
  if (permissions.includes('*')) {
    return [
      '/dashboard',
      '/agendamentos',
      '/clientes',
      '/servicos',
      '/financeiro',
      '/estoque',
      '/propostas',
      '/assinaturas',
      '/tarefas',
      '/relatorios',
      '/configuracoes',
      '/planos',
      '/produtos',
      '/conversas-whatsapp',
      '/pedidos-whatsapp',
      '/treinamento-ia',
      '/historico-pagamentos',
      '/historico-assinaturas',
    ];
  }
  
  // Retorna rotas permitidas (removendo :readonly)
  return permissions.map(p => p.replace(':readonly', ''));
}
