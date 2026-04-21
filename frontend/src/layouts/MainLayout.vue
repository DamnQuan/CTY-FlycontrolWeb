<template>
  <el-container class="main-layout">
    <el-aside class="sidebar" :width="isCollapse ? '64px' : '220px'">
      <div class="logo" @click="toggleCollapse">
        <el-icon class="logo-icon" :size="28"><Promotion /></el-icon>
        <span class="logo-text" v-show="!isCollapse">CTY垂天云</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="nav-menu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
      >
        <el-menu-item index="/home">
          <el-icon><HomeFilled /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="/activities">
          <el-icon><Calendar /></el-icon>
          <template #title>活动列表</template>
        </el-menu-item>
        <el-menu-item index="/metar">
          <el-icon><PartlyCloudy /></el-icon>
          <template #title>METAR报</template>
        </el-menu-item>
        <el-menu-item index="/tickets">
          <el-icon><Tickets /></el-icon>
          <template #title>工单</template>
        </el-menu-item>
        <el-menu-item index="/controller-apply">
          <el-icon><User /></el-icon>
          <template #title>管制员申请</template>
        </el-menu-item>
        <el-menu-item index="/profile">
          <el-icon><UserFilled /></el-icon>
          <template #title>个人中心</template>
        </el-menu-item>
        
        <!-- 管理中心 - 根据权限动态显示 -->
        <el-sub-menu index="/admin" v-if="hasAnyAdminPermission">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>管理中心</span>
          </template>
          <el-menu-item v-if="hasPermission('user:view')" index="/admin/users">
            <el-icon><UserFilled /></el-icon>
            <template #title>用户管理</template>
          </el-menu-item>
          <el-menu-item v-if="hasPermission('controller:view')" index="/admin/controller-applications">
            <el-icon><DocumentChecked /></el-icon>
            <template #title>管制员申请管理</template>
          </el-menu-item>
          <el-menu-item v-if="hasPermission('activity:view')" index="/admin/activities">
            <el-icon><Calendar /></el-icon>
            <template #title>活动管理</template>
          </el-menu-item>
          <el-menu-item v-if="hasPermission('ticket:view')" index="/admin/tickets">
            <el-icon><Tickets /></el-icon>
            <template #title>工单管理</template>
          </el-menu-item>
          <el-menu-item v-if="hasPermission('permission:view')" index="/admin/permissions">
            <el-icon><Lock /></el-icon>
            <template #title>权限管理</template>
          </el-menu-item>
          <el-menu-item v-if="hasPermission('audit:view')" index="/admin/audit-logs">
            <el-icon><List /></el-icon>
            <template #title>审计日志</template>
          </el-menu-item>
        </el-sub-menu>
      </el-menu>
      
      <div class="sidebar-footer">
      </div>
    </el-aside>
    
    <el-container class="main-container">
      <el-header class="header">
        <div class="header-left">
          <el-breadcrumb>
            <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path" :to="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <template v-if="userStore.isLoggedIn">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-avatar :size="32" :src="userStore.userInfo?.avatar">
                  <el-icon><UserFilled /></el-icon>
                </el-avatar>
                <span class="username" v-show="!isCollapse">{{ userStore.userInfo?.username }}</span>
                <el-icon><ArrowDown /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">
                    <el-icon><User /></el-icon>个人中心
                  </el-dropdown-item>
                  <el-dropdown-item divided command="logout">
                    <el-icon><SwitchButton /></el-icon>退出登录
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template v-else>
            <el-button type="primary" @click="$router.push('/login')">登录</el-button>
          </template>
        </div>
      </el-header>
      
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
      
      <el-footer class="footer" height="40px">
        <span>© 2024 CTY垂天云 版权所有</span>
      </el-footer>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import {
  Promotion, HomeFilled, Calendar, PartlyCloudy, Tickets, User,
  Setting, UserFilled, DocumentChecked, Lock, List, ArrowDown,
  SwitchButton
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)

const activeMenu = computed(() => route.path)

const breadcrumbs = computed(() => {
  const matched = route.matched.filter(item => item.meta?.title)
  return matched.map(item => ({
    path: item.path,
    title: item.meta.title
  }))
})

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const hasPermission = (permission) => {
  return userStore.hasPermission(permission)
}

const hasAnyAdminPermission = computed(() => {
  return userStore.hasAnyAdminPermission
})

const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      router.push('/profile')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        userStore.logout()
        ElMessage.success('退出成功')
        router.push('/login')
      })
      break
  }
}
</script>

<style scoped lang="scss">
.main-layout {
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-attachment: fixed;
}

.sidebar {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  transition: width 0.3s;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  padding: 0 15px;
  
  .logo-icon {
    color: #667eea;
    flex-shrink: 0;
  }
  
  .logo-text {
    font-size: 18px;
    font-weight: 600;
    color: #333;
    white-space: nowrap;
  }
}

.nav-menu {
  flex: 1;
  border-right: none;
  background: transparent;
}

.sidebar-footer {
  padding: 15px;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: center;
}

.main-container {
  background: rgba(245, 247, 250, 0.95);
  backdrop-filter: blur(10px);
  margin: 10px;
  border-radius: 20px;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 8px;
  transition: background 0.3s;
  
  &:hover {
    background: #f5f7fa;
  }
  
  .username {
    font-size: 14px;
    color: #606266;
  }
}

.main-content {
  padding: 20px;
  overflow-y: auto;
}

.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
  border-top: 1px solid #e4e7ed;
  color: #909399;
  font-size: 12px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

:deep(.el-menu) {
  background: transparent;
}

:deep(.el-sub-menu__title) {
  &:hover {
    background: rgba(102, 126, 234, 0.1);
  }
}

:deep(.el-menu-item) {
  &:hover {
    background: rgba(102, 126, 234, 0.1);
  }
  
  &.is-active {
    background: rgba(102, 126, 234, 0.15);
    color: #667eea;
  }
}
</style>
