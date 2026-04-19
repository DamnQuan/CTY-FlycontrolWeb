import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/Login.vue'),
    meta: { public: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/auth/Register.vue'),
    meta: { public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/home',
    children: [
      {
        path: 'home',
        name: 'Home',
        component: () => import('@/views/Home.vue'),
        meta: { title: '首页' }
      },
      {
        path: 'activities',
        name: 'Activities',
        component: () => import('@/views/Activities.vue'),
        meta: { title: '活动列表' }
      },
      {
        path: 'activities/:id',
        name: 'ActivityDetail',
        component: () => import('@/views/ActivityDetail.vue'),
        meta: { title: '活动详情' }
      },
      {
        path: 'metar',
        name: 'Metar',
        component: () => import('@/views/Metar.vue'),
        meta: { title: 'METAR报' }
      },
      {
        path: 'tickets',
        name: 'Tickets',
        component: () => import('@/views/Tickets.vue'),
        meta: { title: '工单' }
      },
      {
        path: 'tickets/:id',
        name: 'TicketDetail',
        component: () => import('@/views/TicketDetail.vue'),
        meta: { title: '工单详情' }
      },
      {
        path: 'controller-apply',
        name: 'ControllerApply',
        component: () => import('@/views/ControllerApply.vue'),
        meta: { title: '管制员申请' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人中心' }
      },
      // 管理页面 - 移到主布局下，每个页面单独权限控制
      {
        path: 'admin/users',
        name: 'AdminUsers',
        component: () => import('@/views/admin/Users.vue'),
        meta: { title: '用户管理', permission: 'user:view' }
      },
      {
        path: 'admin/activities',
        name: 'AdminActivities',
        component: () => import('@/views/admin/Activities.vue'),
        meta: { title: '活动管理', permission: 'activity:view' }
      },
      {
        path: 'admin/tickets',
        name: 'AdminTickets',
        component: () => import('@/views/admin/Tickets.vue'),
        meta: { title: '工单管理', permission: 'ticket:view' }
      },
      {
        path: 'admin/controller-applications',
        name: 'AdminControllerApplications',
        component: () => import('@/views/admin/ControllerApplications.vue'),
        meta: { title: '管制员申请管理', permission: 'controller:view' }
      },
      {
        path: 'admin/permissions',
        name: 'AdminPermissions',
        component: () => import('@/views/admin/Permissions.vue'),
        meta: { title: '权限管理', permission: 'permission:view' }
      },
      {
        path: 'admin/audit-logs',
        name: 'AdminAuditLogs',
        component: () => import('@/views/admin/AuditLogs.vue'),
        meta: { title: '审计日志', permission: 'audit:view' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()
  
  // 设置页面标题
  if (to.meta.title) {
    document.title = `${to.meta.title} - CTY垂天云`
  }
  
  // 公开页面直接放行
  if (to.meta.public) {
    if (userStore.isLoggedIn) {
      return next('/')
    }
    return next()
  }
  
  // 检查是否登录
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    return next('/login')
  }
  
  // 获取用户信息（如果还没有）
  if (!userStore.userInfo) {
    try {
      await userStore.fetchUserInfo()
    } catch {
      return next('/login')
    }
  }
  
  // 检查具体权限
  if (to.meta.permission && !userStore.hasPermission(to.meta.permission)) {
    ElMessage.error('无权访问此页面')
    return next('/')
  }
  
  next()
})

export default router
