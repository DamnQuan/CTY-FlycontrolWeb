<template>
  <div class="admin-audit-logs">
    <div class="page-header">
      <h1>审计日志</h1>
    </div>

    <!-- 日志列表 -->
    <el-card>
      <el-table :data="logs" v-loading="loading" stripe>
        <el-table-column type="index" width="50" />
        <el-table-column prop="createdAt" label="操作时间" width="160">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="user" label="操作人" width="120">
          <template #default="{ row }">
            {{ row.user?.username }}
          </template>
        </el-table-column>
        <el-table-column prop="action" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="getActionType(row.action)" size="small">
              {{ getActionText(row.action) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resource" label="操作对象" width="120">
          <template #default="{ row }">
            {{ getResourceText(row.resource) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="130" />
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { formatDateTime } from '@/utils/date'
import { getAuditLogs } from '@/api/audit'

const loading = ref(false)
const logs = ref([])

const filterForm = reactive({
  username: '',
  action: '',
  resource: '',
  dateRange: []
})

const pagination = reactive({
  page: 1,
  pageSize: 20,
  total: 0
})

const actionMap = {
  login: '登录',
  logout: '登出',
  create: '创建',
  update: '更新',
  delete: '删除',
  review: '审核'
}

const actionTypeMap = {
  login: 'success',
  logout: 'info',
  create: 'success',
  update: 'warning',
  delete: 'danger',
  review: 'primary'
}

const resourceMap = {
  user: '用户',
  activity: '活动',
  ticket: '工单',
  controller_application: '管制员申请',
  permission: '权限',
  role: '角色'
}

const getActionText = (action) => actionMap[action] || action
const getActionType = (action) => actionTypeMap[action] || ''
const getResourceText = (resource) => resourceMap[resource] || resource

const fetchLogs = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      pageSize: pagination.pageSize,
      username: filterForm.username,
      action: filterForm.action,
      resource: filterForm.resource
    }
    if (filterForm.dateRange && filterForm.dateRange.length === 2) {
      params.startDate = filterForm.dateRange[0]
      params.endDate = filterForm.dateRange[1]
    }
    const res = await getAuditLogs(params)
    logs.value = res.data || []
    pagination.total = res.pagination?.total || 0
  } catch (error) {
    console.error('Fetch audit logs error:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchLogs()
}

const resetFilter = () => {
  filterForm.username = ''
  filterForm.action = ''
  filterForm.resource = ''
  filterForm.dateRange = []
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  fetchLogs()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchLogs()
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped lang="scss">
.admin-audit-logs {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h1 {
      margin: 0;
      font-size: 24px;
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
