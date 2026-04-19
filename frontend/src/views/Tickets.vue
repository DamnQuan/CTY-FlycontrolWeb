<template>
  <div class="tickets-page">
    <el-card shadow="hover">
      <template #header>
        <div class="page-header">
          <div class="header-left">
            <span class="page-title">工单中心</span>
          </div>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>
            提交工单
          </el-button>
        </div>
      </template>

      <el-skeleton :rows="5" animated v-if="loading" />

      <div v-else-if="tickets.length > 0" class="ticket-list">
        <div
          v-for="ticket in tickets"
          :key="ticket.id"
          class="ticket-item"
          @click="goToDetail(ticket.id)"
        >
          <div class="ticket-main">
            <div class="ticket-header">
              <span class="ticket-no">{{ ticket.ticketNo }}</span>
              <el-tag :type="getStatusType(ticket.status)" size="small">
                {{ getStatusText(ticket.status) }}
              </el-tag>
            </div>
            <h3 class="ticket-title">{{ ticket.title }}</h3>
            <p class="ticket-desc">{{ ticket.description || '无描述' }}</p>
            <div class="ticket-meta">
              <span class="meta-item">
                <el-icon><Folder /></el-icon>
                {{ getTypeText(ticket.type) }}
              </span>
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ formatDateTime(ticket.createdAt) }}
              </span>
              <span class="meta-item" v-if="ticket.repliesCount">
                <el-icon><ChatDotRound /></el-icon>
                {{ ticket.repliesCount }} 回复
              </span>
            </div>
          </div>
          <div class="ticket-arrow">
            <el-icon><ArrowRight /></el-icon>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无工单" />

      <div class="pagination-wrapper" v-if="pagination.total > pagination.pageSize">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 30]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 创建工单对话框 -->
    <el-dialog
      v-model="showCreateDialog"
      title="提交工单"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="80px"
      >
        <el-form-item label="工单类型" prop="type">
          <el-select v-model="form.type" placeholder="请选择工单类型" style="width: 100%">
            <el-option label="问题反馈" value="bug" />
            <el-option label="功能建议" value="feature" />
            <el-option label="技术支持" value="support" />
            <el-option label="投诉建议" value="complaint" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入工单标题" maxlength="100" show-word-limit />
        </el-form-item>
        <el-form-item label="内容" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="5"
            placeholder="请详细描述您的问题"
            maxlength="2000"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">提交</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Folder, Clock, ChatDotRound, ArrowRight } from '@element-plus/icons-vue'
import { getTickets, createTicket } from '@/api/ticket'
import { formatDateTime } from '@/utils/date'

const router = useRouter()
const loading = ref(false)
const tickets = ref([])
const filterStatus = ref('')
const showCreateDialog = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const form = ref({
  type: '',
  title: '',
  description: ''
})

const rules = {
  type: [{ required: true, message: '请选择工单类型', trigger: 'change' }],
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }],
  description: [{ required: true, message: '请输入内容', trigger: 'blur' }]
}

const pagination = ref({
  page: 1,
  pageSize: 10,
  total: 0
})

const fetchTickets = async () => {
  loading.value = true
  try {
    const res = await getTickets({
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      status: filterStatus.value
    })
    tickets.value = res.data || []
    pagination.value.total = res.pagination?.total || 0
  } catch (error) {
    console.error('获取工单列表失败:', error)
    ElMessage.error('获取工单列表失败')
  } finally {
    loading.value = false
  }
}

const handleFilterChange = () => {
  pagination.value.page = 1
  fetchTickets()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  fetchTickets()
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  fetchTickets()
}

const handleSubmit = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const res = await createTicket(form.value)
    if (res.success) {
      ElMessage.success('工单提交成功')
      showCreateDialog.value = false
      form.value = { type: '', title: '', description: '' }
      fetchTickets()
    } else {
      ElMessage.error(res.message || '提交失败')
    }
  } catch (error) {
    console.error('提交工单失败:', error)
    ElMessage.error('提交失败')
  } finally {
    submitting.value = false
  }
}

const goToDetail = (id) => {
  router.push(`/tickets/${id}`)
}

const getStatusText = (status) => {
  const map = {
    'open': '待处理',
    'processing': '处理中',
    'resolved': '已解决',
    'closed': '已关闭'
  }
  return map[status] || status
}

const getStatusType = (status) => {
  const map = {
    'open': 'danger',
    'processing': 'warning',
    'resolved': 'success',
    'closed': 'info'
  }
  return map[status] || ''
}

const getTypeText = (type) => {
  const map = {
    'bug': '问题反馈',
    'feature': '功能建议',
    'support': '技术支持',
    'complaint': '投诉建议',
    'other': '其他'
  }
  return map[type] || type
}

onMounted(() => {
  fetchTickets()
})
</script>

<style scoped lang="scss">
.tickets-page {
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 15px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 20px;
      flex-wrap: wrap;
    }

    .page-title {
      font-size: 20px;
      font-weight: 600;
      color: #303133;
    }
  }

  .ticket-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .ticket-item {
    display: flex;
    align-items: center;
    padding: 20px;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      transform: translateX(5px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      border-color: #667eea;
    }

    .ticket-main {
      flex: 1;
      min-width: 0;

      .ticket-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 8px;

        .ticket-no {
          font-size: 12px;
          color: #909399;
          font-family: monospace;
        }
      }

      .ticket-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 8px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ticket-desc {
        font-size: 14px;
        color: #606266;
        margin: 0 0 12px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ticket-meta {
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;

        .meta-item {
          font-size: 13px;
          color: #909399;
          display: flex;
          align-items: center;
          gap: 5px;

          .el-icon {
            font-size: 14px;
          }
        }
      }
    }

    .ticket-arrow {
      margin-left: 15px;
      color: #c0c4cc;
      transition: color 0.3s;
    }

    &:hover .ticket-arrow {
      color: #667eea;
    }
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .tickets-page {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .ticket-meta {
      gap: 10px !important;
    }
  }
}
</style>
