// 权限配置 - 每个功能有独立的权限节点

const PERMISSIONS = {
  // 用户管理
  USER_VIEW: 'user:view',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // 活动管理
  ACTIVITY_VIEW: 'activity:view',
  ACTIVITY_CREATE: 'activity:create',
  ACTIVITY_UPDATE: 'activity:update',
  ACTIVITY_DELETE: 'activity:delete',
  
  // 工单管理
  TICKET_VIEW: 'ticket:view',
  TICKET_CREATE: 'ticket:create',
  TICKET_UPDATE: 'ticket:update',
  TICKET_DELETE: 'ticket:delete',
  TICKET_ASSIGN: 'ticket:assign',
  
  // 管制员申请管理
  CONTROLLER_VIEW: 'controller:view',
  CONTROLLER_REVIEW: 'controller:review',
  
  // 权限管理
  PERMISSION_VIEW: 'permission:view',
  PERMISSION_GRANT: 'permission:grant',
  
  // 审计日志
  AUDIT_VIEW: 'audit:view',
  
  // 系统设置
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_UPDATE: 'settings:update'
};

// 所有权限列表（用于初始化或展示）
const ALL_PERMISSIONS = Object.values(PERMISSIONS);

// 管理权限分组（仅用于前端展示，不绑定角色）
const PERMISSION_GROUPS = {
  user: {
    name: '用户管理',
    permissions: [PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_UPDATE, PERMISSIONS.USER_DELETE]
  },
  activity: {
    name: '活动管理',
    permissions: [PERMISSIONS.ACTIVITY_VIEW, PERMISSIONS.ACTIVITY_CREATE, PERMISSIONS.ACTIVITY_UPDATE, PERMISSIONS.ACTIVITY_DELETE]
  },
  ticket: {
    name: '工单管理',
    permissions: [PERMISSIONS.TICKET_VIEW, PERMISSIONS.TICKET_CREATE, PERMISSIONS.TICKET_UPDATE, PERMISSIONS.TICKET_DELETE, PERMISSIONS.TICKET_ASSIGN]
  },
  controller: {
    name: '管制员申请管理',
    permissions: [PERMISSIONS.CONTROLLER_VIEW, PERMISSIONS.CONTROLLER_REVIEW]
  },
  permission: {
    name: '权限管理',
    permissions: [PERMISSIONS.PERMISSION_VIEW, PERMISSIONS.PERMISSION_GRANT]
  },
  audit: {
    name: '审计日志',
    permissions: [PERMISSIONS.AUDIT_VIEW]
  },
  settings: {
    name: '系统设置',
    permissions: [PERMISSIONS.SETTINGS_VIEW, PERMISSIONS.SETTINGS_UPDATE]
  }
};

module.exports = {
  PERMISSIONS,
  ALL_PERMISSIONS,
  PERMISSION_GROUPS
};
