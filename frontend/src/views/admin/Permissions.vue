<template>
  <div class="admin-permissions">
    <div class="page-header">
      <h1>权限管理</h1>
    </div>

    <!-- 用户列表 -->
    <el-card>
      <el-table :data="users" v-loading="loading" stripe>
        <el-table-column type="index" width="50" />
        <el-table-column label="用户" min-width="200">
          <template #default="{ row }">
            <div class="user-info">
              <el-avatar :size="40" :src="row.avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <div class="user-detail">
                <div class="username">{{ row.username }}</div>
                <div class="email">{{ row.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="cid" label="CID" width="120" />
        <el-table-column prop="rating" label="Rating" width="80" />
        <el-table-column label="当前权限" min-width="300">
          <template #default="{ row }">
            <div class="permission-tags">
              <el-tag 
                v-for="perm in row.permissions" 
                :key="perm"
                size="small"
                class="permission-tag"
              >
                {{ getPermissionLabel(perm) }}
              </el-tag>
              <span v-if="!row.permissions?.length" class="no-permission">无权限</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEditPermissions(row)">
              编辑权限
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 编辑权限对话框 -->
    <el-dialog v-model="showPermissionDialog" title="编辑用户权限" width="700px">
      <div v-if="currentUser" class="permission-edit">
        <div class="user-info-header">
          <el-avatar :size="50" :src="currentUser.avatar">
            <el-icon><UserFilled /></el-icon>
          </el-avatar>
          <div class="user-meta">
            <div class="username">{{ currentUser.username }}</div>
            <div class="email">{{ currentUser.email }}</div>
          </div>
        </div>

        <el-divider />

        <div class="permission-groups">
          <div v-for="group in permissionGroups" :key="group.name" class="permission-group">
            <div class="group-title">{{ group.name }}</div>
            <div class="group-permissions">
              <el-checkbox
                v-for="perm in group.permissions"
                :key="perm.key"
                v-model="selectedPermissions[perm.key]"
                class="permission-checkbox"
              >
                {{ perm.label }}
              </el-checkbox>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPermissionDialog = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSavePermissions">
          保存权限
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled } from '@element-plus/icons-vue'
import { getUserList } from '@/api/user'
import { getUserPermissions, updateUserPermissions } from '@/api/permission'

const loading = ref(false)
const saving = ref(false)
const users = ref([])
const showPermissionDialog = ref(false)
const currentUser = ref(null)
const selectedPermissions = reactive({})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

// 权限分组定义
const permissionGroups = [
  {
    name: '用户管理',
    permissions: [
      { key: 'user:view', label: '查看用户' },
      { key: 'user:create', label: '创建用户' },
      { key: 'user:update', label: '编辑用户' },
      { key: 'user:delete', label: '删除用户' }
    ]
  },
  {
    name: '活动管理',
    permissions: [
      { key: 'activity:view', label: '查看活动' },
      { key: 'activity:create', label: '创建活动' },
      { key: 'activity:update', label: '编辑活动' },
      { key: 'activity:delete', label: '删除活动' }
    ]
  },
  {
    name: '工单管理',
    permissions: [
      { key: 'ticket:view', label: '查看工单' },
      { key: 'ticket:create', label: '创建工单' },
      { key: 'ticket:update', label: '处理工单' },
      { key: 'ticket:delete', label: '删除工单' }
    ]
  },
  {
    name: '管制员申请',
    permissions: [
      { key: 'controller:view', label: '查看申请' },
      { key: 'controller:review', label: '审核申请' }
    ]
  },
  {
    name: '权限管理',
    permissions: [
      { key: 'permission:view', label: '查看权限' },
      { key: 'permission:grant', label: '分配权限' }
    ]
  },
  {
    name: '审计日志',
    permissions: [
      { key: 'audit:view', label: '查看日志' }
    ]
  }
]

// 获取权限显示标签
const getPermissionLabel = (key) => {
  for (const group of permissionGroups) {
    const perm = group.permissions.find(p => p.key === key)
    if (perm) return perm.label
  }
  return key
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    users.value = res.data || []
    pagination.total = res.pagination?.total || 0
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleEditPermissions = async (row) => {
  currentUser.value = row
  
  // 初始化所有权限为false
  Object.keys(selectedPermissions).forEach(key => delete selectedPermissions[key])
  
  // 设置当前用户已有的权限为true
  if (row.permissions) {
    row.permissions.forEach(perm => {
      selectedPermissions[perm] = true
    })
  }
  
  showPermissionDialog.value = true
}

const handleSavePermissions = async () => {
  if (!currentUser.value) return
  
  saving.value = true
  try {
    // 收集选中的权限
    const permissions = Object.entries(selectedPermissions)
      .filter(([_, value]) => value)
      .map(([key]) => key)
    
    await updateUserPermissions(currentUser.value.id, permissions)
    ElMessage.success('权限更新成功')
    showPermissionDialog.value = false
    fetchUsers()
  } catch (error) {
    console.error('保存权限失败:', error)
    ElMessage.error('保存权限失败')
  } finally {
    saving.value = false
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchUsers()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchUsers()
}

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped lang="scss">
.admin-permissions {
  .page-header {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h1 {
      margin: 0;
      font-size: 24px;
      color: #303133;
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;

    .user-detail {
      .username {
        font-weight: 500;
        color: #303133;
      }
      .email {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .permission-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;

    .permission-tag {
      margin: 0;
    }

    .no-permission {
      color: #909399;
      font-size: 12px;
    }
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .permission-edit {
    .user-info-header {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;

      .user-meta {
        .username {
          font-size: 18px;
          font-weight: 500;
          color: #303133;
        }
        .email {
          font-size: 14px;
          color: #909399;
        }
      }
    }

    .permission-groups {
      max-height: 400px;
      overflow-y: auto;

      .permission-group {
        margin-bottom: 20px;

        .group-title {
          font-weight: 500;
          color: #303133;
          margin-bottom: 12px;
          padding-bottom: 8px;
          border-bottom: 1px solid #ebeef5;
        }

        .group-permissions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;

          .permission-checkbox {
            margin-right: 0;
            min-width: 120px;
          }
        }
      }
    }
  }
}
</style>
