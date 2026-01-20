// Staff Permission Definitions and Utilities
// This file defines what each staff role can and cannot do

export const STAFF_ROLES = {
  FINANCE_MANAGER: "finance_manager",
  GENERAL_MANAGER: "general_manager",
  SUPPORT_MANAGER: "support_manager",
  SUPPORT_AGENT: "support_agent",
}

// Role Display Names
export const ROLE_DISPLAY_NAMES = {
  finance_manager: "Finance Manager",
  general_manager: "General Manager",
  support_manager: "Support Manager",
  support_agent: "Support Agent",
  tenant_admin: "Tenant Admin",
  superadmin: "Super Admin",
  super_admin: "Super Admin",
  agent: "Agent",
  sub_agent: "Sub Agent",
  player: "Player",
}

// Role Descriptions
export const ROLE_DESCRIPTIONS = {
  finance_manager: "Manages all financial operations including deposits, withdrawals, and reporting",
  general_manager: "Creates and manages agents, views KPIs, and oversees operations",
  support_manager: "Leads support team, handles escalations, and manages player issues",
  support_agent: "Handles player support tickets and basic account assistance",
}

// Permissions by Role
export const ROLE_PERMISSIONS = {
  finance_manager: {
    // CAN DO
    can: [
      "view_deposits",
      "view_withdrawals",
      "approve_withdrawals",
      "decline_withdrawals",
      "view_wallet_ledger",
      "view_balances",
      "view_adjustments_history",
      "view_reconciliation_reports",
      "export_finance_reports",
      "view_ggr",
    ],
    // CANNOT DO
    cannot: [
      "add_edit_games",
      "create_tenants",
      "create_agents",
      "create_admins",
      "change_commission_models",
      "access_api_keys",
      "view_edit_system_settings",
    ],
    // Menu items to show
    menuItems: ["overview", "deposits", "withdrawals", "wallet-ledger", "reconciliation", "reports"],
  },
  general_manager: {
    can: [
      "create_agents",
      "set_commission_limits",
      "create_support_users",
      "view_ggr",
      "view_active_players",
      "view_deposits_summary",
      "view_withdrawals_summary",
      "view_tenant_settings_readonly",
    ],
    cannot: [
      "approve_withdrawals",
      "access_finance_tools",
      "view_player_personal_data",
      "edit_api_keys",
      "edit_system_configuration",
    ],
    menuItems: ["overview", "agents", "kpis", "support-team", "settings-readonly"],
  },
  support_manager: {
    can: [
      "view_tickets",
      "view_chat_inbox",
      "view_player_profile_limited",
      "reset_passwords",
      "lock_accounts",
      "view_bet_history",
      "view_transaction_history",
      "create_notes",
      "escalate_issues",
      "manage_support_agents",
    ],
    cannot: [
      "adjust_balances",
      "approve_withdrawals",
      "change_commissions",
      "create_tenants",
      "create_agents",
      "access_api_keys",
    ],
    menuItems: ["overview", "tickets", "players", "escalations", "team"],
  },
  support_agent: {
    can: [
      "view_tickets",
      "view_chat_inbox",
      "view_player_profile_limited",
      "view_bet_history",
      "view_transaction_history",
      "create_notes",
      "escalate_issues",
    ],
    cannot: [
      "reset_passwords",
      "lock_accounts",
      "adjust_balances",
      "approve_withdrawals",
      "change_commissions",
      "create_tenants",
      "create_agents",
      "access_api_keys",
      "manage_team",
    ],
    menuItems: ["tickets", "players"],
  },
}

// Check if user has specific permission
export function hasPermission(userRole, permission) {
  const rolePerms = ROLE_PERMISSIONS[userRole]
  if (!rolePerms) return false
  return rolePerms.can.includes(permission)
}

// Check if user is denied a specific permission
export function isDeniedPermission(userRole, permission) {
  const rolePerms = ROLE_PERMISSIONS[userRole]
  if (!rolePerms) return true
  return rolePerms.cannot.includes(permission)
}

// Get menu items for a role
export function getMenuItemsForRole(userRole) {
  const rolePerms = ROLE_PERMISSIONS[userRole]
  if (!rolePerms) return []
  return rolePerms.menuItems
}

// Check if user can access a specific route
export function canAccessRoute(userRole, route) {
  const routePermissions = {
    "/staff/finance/deposits": ["view_deposits"],
    "/staff/finance/withdrawals": ["view_withdrawals"],
    "/staff/finance/wallet-ledger": ["view_wallet_ledger"],
    "/staff/finance/reports": ["export_finance_reports"],
    "/staff/gm/agents": ["create_agents"],
    "/staff/gm/kpis": ["view_ggr"],
    "/staff/support/tickets": ["view_tickets"],
    "/staff/support/players": ["view_player_profile_limited"],
  }

  const requiredPermissions = routePermissions[route]
  if (!requiredPermissions) return true // No specific permissions required

  return requiredPermissions.some((perm) => hasPermission(userRole, perm))
}

// Get all permissions for a role (for UI display)
export function getAllPermissionsForRole(role) {
  return ROLE_PERMISSIONS[role] || { can: [], cannot: [], menuItems: [] }
}

// Staff role hierarchy - who can create whom
export function canCreateRole(creatorRole, targetRole) {
  const hierarchy = {
    tenant_admin: ["finance_manager", "general_manager", "support_manager", "support_agent"],
    superadmin: ["finance_manager", "general_manager", "support_manager", "support_agent"],
    super_admin: ["finance_manager", "general_manager", "support_manager", "support_agent"],
    general_manager: ["support_manager", "support_agent"],
    support_manager: ["support_agent"],
  }

  const allowedRoles = hierarchy[creatorRole]
  if (!allowedRoles) return false
  return allowedRoles.includes(targetRole)
}

// Get roles that a user can create
export function getCreatableRoles(creatorRole) {
  const hierarchy = {
    tenant_admin: ["finance_manager", "general_manager", "support_manager", "support_agent"],
    superadmin: ["finance_manager", "general_manager", "support_manager", "support_agent"],
    super_admin: ["finance_manager", "general_manager", "support_manager", "support_agent"],
    general_manager: ["support_manager", "support_agent"],
    support_manager: ["support_agent"],
  }

  return hierarchy[creatorRole] || []
}
