<template>
  <div class="admin-tickets">
    <div class="page-header">
      <h1>工单管理</h1>
    </div>



    <!-- 工单列表 -->
    <el-card>
      <el-table :data="tickets" v-loading="loading" stripe>
        <el-table-column prop="ticketNo" label="工单编号" width="140" />
        <el-table-column prop="title" label="标题" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ getTypeText(row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="90">
          <template #default="{ row }">
            <el-tag :type="getPriorityType(row.priority)" size="small">
              {{ getPriorityText(row.priority) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="120">
          <template #default="{ row }">
            {{ row.creator?.username }}
          </template>
        </el-table-column>
        <el-table-column prop="assignee" label="处理人" width="120">
          <template #default="{ row }">
            <span v-if="row.assignee">{{ row.assignee.username }}</span>
            <el-button v-else link type="primary" @click="handleAssign(row)">
              分配
            </el-button>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <el-button link type="success" @click="handleReply(row)">回复</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 分配工单对话框 -->
    <el-dialog v-model="showAssignDialog" title="分配工单" width="400px">
      <el-form label-width="80px">
        <el-form-item label="处理人">
          <el-select v-model="assignForm.assigneeId" placeholder="请选择处理人" style="width: 100%;">
            <el-option
              v-for="user in adminUsers"
              :key="user._id"
              :label="user.username"
              :value="user._id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAssignDialog = false">取消</el-button>
        <el-button type="primary" :loading="assignLoading" @click="handleAssignSubmit">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 回复工单对话框 -->
    <el-dialog v-model="showReplyDialog" title="回复工单" width="600px">
      <div class="ticket-preview">
        <h4>{{ currentTicket?.title }}</h4>
        <p>{{ currentTicket?.description }}</p>
      </div>
      <el-form label-width="80px">
        <el-form-item label="回复内容">
          <el-input
            v-model="replyForm.content"
            type="textarea"
            :rows="4"
            placeholder="请输入回复内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReplyDialog = false">取消</el-button>
        <el-button type="primary" :loading="replyLoading" @click="handleReplySubmit">
          提交回复并关闭
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate } from '@/utils/date'
import { getTicketList, assignTicket, addComment, updateTicket, deleteTicket } from '@/api/ticket'
import { getUserList } from '@/api/user'

const router = useRouter()

const loading = ref(false)
const assignLoading = ref(false)
const replyLoading = ref(false)
const tickets = ref([])
const adminUsers = ref([])
const showAssignDialog = ref(false)
const showReplyDialog = ref(false)
const currentTicket = ref(null)

const filterForm = reactive({
  keyword: '',
  type: '',
  status: '',
  priority: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const assignForm = reactive({
  assigneeId: ''
})

const replyForm = reactive({
  content: '',
  status: ''
})

const typeMap = {
  bug: 'Bug反馈',
  feature: '功能建议',
  support: '技术支持',
  complaint: '投诉建议',
  other: '其他'
}

const priorityMap = {
  urgent: '紧急',
  high: '高',
  medium: '中',
  low: '低'
}

const statusMap = {
  open: '待处理',
  processing: '处理中',
  pending: '待确认',
  resolved: '已解决',
  closed: '已关闭'
}

const priorityTypeMap = {
  urgent: 'danger',
  high: 'warning',
  medium: '',
  low: 'info'
}

const statusTypeMap = {
  open: 'danger',
  processing: 'warning',
  pending: 'info',
  resolved: 'success',
  closed: ''
}

const getTypeText = (type) => typeMap[type] || type
const getPriorityText = (priority) => priorityMap[priority] || priority
const getStatusText = (status) => statusMap[status] || status
const getPriorityType = (priority) => priorityTypeMap[priority] || ''
const getStatusType = (status) => statusTypeMap[status] || ''

const fetchTickets = async () => {
  loading.value = true
  try {
    const res = await getTicketList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      keyword: filterForm.keyword,
      type: filterForm.type,
      status: filterForm.status,
      priority: filterForm.priority
    })
    tickets.value = res.data || []
    pagination.total = res.pagination?.total || 0
  } catch (error) {
    console.error('Fetch tickets error:', error)
  } finally {
    loading.value = false
  }
}

const fetchAdminUsers = async () => {
  try {
    const res = await getUserList({ role: 'admin', pageSize: 100 })
    adminUsers.value = res.data || []
  } catch (error) {
    console.error('Fetch admin users error:', error)
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchTickets()
}

const resetFilter = () => {
  filterForm.keyword = ''
  filterForm.type = ''
  filterForm.status = ''
  filterForm.priority = ''
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  fetchTickets()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchTickets()
}

const handleView = (row) => {
  router.push(`/tickets/${row.id}`)
}

const handleAssign = (row) => {
  currentTicket.value = row
  assignForm.assigneeId = row.assignee?._id || ''
  showAssignDialog.value = true
}

const handleAssignSubmit = async () => {
  assignLoading.value = true
  try {
    await assignTicket(currentTicket.value._id, { assigneeId: assignForm.assigneeId })
    ElMessage.success('分配成功')
    showAssignDialog.value = false
    fetchTickets()
  } catch (error) {
    console.error('Assign ticket error:', error)
  } finally {
    assignLoading.value = false
  }
}

const handleReply = (row) => {
  currentTicket.value = row
  replyForm.content = ''
  replyForm.status = row.status
  showReplyDialog.value = true
}

const handleReplySubmit = async () => {
  if (!replyForm.content.trim()) {
    ElMessage.warning('请输入回复内容')
    return
  }

  replyLoading.value = true
  try {
    await addComment(currentTicket.value.id, { content: replyForm.content })
    ElMessage.success('回复成功')
    showReplyDialog.value = false
    fetchTickets()
  } catch (error) {
    console.error('Reply ticket error:', error)
  } finally {
    replyLoading.value = false
  }
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除此工单吗？删除后无法恢复！', '警告', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await deleteTicket(row.id)
    ElMessage.success('删除成功')
    fetchTickets()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Delete ticket error:', error)
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchTickets()
  fetchAdminUsers()
})
</script>

<style scoped lang="scss">
.admin-tickets {
  .page-header {
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

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 24px;
  }

  .ticket-preview {
    background: #f5f7fa;
    padding: 16px;
    border-radius: 4px;
    margin-bottom: 20px;
    
    h4 {
      margin: 0 0 8px;
      color: #303133;
    }
    
    p {
      margin: 0;
      color: #606266;
      font-size: 14px;
    }
  }
}
</style>
