<template>
  <div class="admin-users">
    <div class="page-header">
      <h1>用户管理</h1>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>添加用户
      </el-button>
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
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="getRoleType(row.role)">
              {{ getRoleText(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="isActive" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.isActive ? 'success' : 'danger'">
              {{ row.isActive ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.lastLoginAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button 
              link 
              :type="row.isActive ? 'danger' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.isActive ? '禁用' : '启用' }}
            </el-button>
            <el-button link type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
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

    <!-- 创建/编辑用户对话框 -->
    <el-dialog
      v-model="showDialog"
      :title="isEdit ? '编辑用户' : '添加用户'"
      width="500px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="form.username" :disabled="isEdit" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="CID">
          <el-input v-model="form.cid" />
        </el-form-item>
        <el-form-item label="Rating">
          <el-input v-model="form.rating" placeholder="如: S1, S2, S3, C1, C2, C3, I1, I3, SUP, ADM" />
        </el-form-item>
        <el-form-item label="密码" v-if="!isEdit">
          <el-input v-model="form.password" type="password" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate, formatDateTime } from '@/utils/date'
import { getUserList, createUser, updateUser, deleteUser } from '@/api/user'

const loading = ref(false)
const submitting = ref(false)
const users = ref([])
const showDialog = ref(false)
const showCreateDialog = ref(false)
const isEdit = ref(false)
const currentId = ref(null)

const filterForm = reactive({
  keyword: '',
  role: '',
  isActive: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  username: '',
  email: '',
  password: '',
  cid: '',
  rating: ''
})

const roleMap = {
  user: '普通用户',
  controller: '管制员',
  admin: '管理员',
  super_admin: '超级管理员'
}

const roleTypeMap = {
  user: '',
  controller: 'success',
  admin: 'warning',
  super_admin: 'danger'
}

const getRoleText = (role) => roleMap[role] || role
const getRoleType = (role) => roleTypeMap[role] || ''

const fetchUsers = async () => {
  loading.value = true
  try {
    const res = await getUserList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filterForm.keyword,
      role: filterForm.role,
      isActive: filterForm.isActive
    })
    users.value = res.data || []
    pagination.total = res.pagination?.total || 0
  } catch (error) {
    console.error('Fetch users error:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchUsers()
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.role = ''
  filterForm.isActive = ''
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  fetchUsers()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchUsers()
}

const handleEdit = (row) => {
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, {
    username: row.username,
    email: row.email,
    cid: row.cid || '',
    rating: row.rating || ''
  })
  showDialog.value = true
}

const handleToggleStatus = async (row) => {
  try {
    await ElMessageBox.confirm(
      `确定要${row.isActive ? '禁用' : '启用'}该用户吗？`,
      '提示',
      { type: 'warning' }
    )
    await updateUser(row.id, { isActive: !row.isActive })
    ElMessage.success('操作成功')
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Toggle status error:', error)
    }
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？此操作不可恢复！', '警告', {
      type: 'error'
    })
    await deleteUser(row.id)
    ElMessage.success('删除成功')
    fetchUsers()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete user error:', error)
    }
  }
}

const handleSubmit = async () => {
  if (!form.username || !form.email) {
    ElMessage.warning('请填写完整信息')
    return
  }

  submitting.value = true
  try {
    if (isEdit.value) {
      await updateUser(currentId.value, form)
    } else {
      if (!form.password) {
        ElMessage.warning('请输入密码')
        return
      }
      await createUser(form)
    }
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    showDialog.value = false
    fetchUsers()
  } catch (error) {
    console.error('Submit error:', error)
  } finally {
    submitting.value = false
  }
}

// 监听创建对话框
watch(() => showCreateDialog.value, (val) => {
  if (val) {
    isEdit.value = false
    currentId.value = null
    Object.assign(form, {
      username: '',
      email: '',
      password: '',
      cid: '',
      rating: ''
    })
    showDialog.value = true
    showCreateDialog.value = false
  }
})

import { watch } from 'vue'

onMounted(() => {
  fetchUsers()
})
</script>

<style scoped lang="scss">
.admin-users {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    
    h1 {
      margin: 0;
      font-size: 24px;
      color: #303133;
    }
  }

  .filter-card {
    margin-bottom: 24px;
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

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
  }
}
</style>
