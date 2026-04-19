<template>
  <div class="admin-applications">
    <div class="page-header">
      <h1>管制员申请管理</h1>
    </div>

    <!-- 申请列表 -->
    <el-card>
      <el-table :data="applications" v-loading="loading" stripe>
        <el-table-column type="index" width="50" />
        <el-table-column label="申请人" min-width="200">
          <template #default="{ row }">
            <div class="applicant-info">
              <el-avatar :size="40" :src="row.applicant?.avatar">
                <el-icon><UserFilled /></el-icon>
              </el-avatar>
              <div class="applicant-detail">
                <div class="username">{{ row.applicant?.username }}</div>
                <div class="email">{{ row.applicant?.email }}</div>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="cid" label="CID" width="120" />
        <el-table-column prop="realName" label="真实姓名" width="120" />
        <el-table-column prop="rating" label="等级" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.rating }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="submittedAt" label="申请时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.submittedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleView(row)">查看</el-button>
            <template v-if="row.status === 'pending' || row.status === 'reviewing'">
              <el-button link type="success" @click="handleApprove(row)">通过</el-button>
              <el-button link type="danger" @click="handleReject(row)">拒绝</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 查看详情对话框 -->
    <el-dialog v-model="showDetailDialog" title="申请详情" width="600px">
      <div v-if="currentApplication" class="application-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="申请人">
            {{ currentApplication.applicant?.username }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱">
            {{ currentApplication.email }}
          </el-descriptions-item>
          <el-descriptions-item label="CID">
            {{ currentApplication.cid }}
          </el-descriptions-item>
          <el-descriptions-item label="真实姓名">
            {{ currentApplication.realName }}
          </el-descriptions-item>
          <el-descriptions-item label="联系电话">
            {{ currentApplication.phone }}
          </el-descriptions-item>
          <el-descriptions-item label="管制等级">
            {{ currentApplication.rating }}
          </el-descriptions-item>
          <el-descriptions-item label="申请状态" :span="2">
            <el-tag :type="getStatusType(currentApplication.status)">
              {{ getStatusText(currentApplication.status) }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>
        
        <div class="detail-section">
          <h4>管制经验</h4>
          <p>{{ currentApplication.experience }}</p>
        </div>
        
        <div class="detail-section">
          <h4>申请动机</h4>
          <p>{{ currentApplication.motivation }}</p>
        </div>
        
        <div v-if="currentApplication.reviewNotes" class="detail-section">
          <h4>审核备注</h4>
          <p>{{ currentApplication.reviewNotes }}</p>
        </div>
      </div>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog v-model="showReviewDialog" :title="reviewType === 'approve' ? '通过申请' : '拒绝申请'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="审核备注">
          <el-input
            v-model="reviewForm.notes"
            type="textarea"
            :rows="4"
            placeholder="请输入审核备注（可选）"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showReviewDialog = false">取消</el-button>
        <el-button 
          :type="reviewType === 'approve' ? 'success' : 'danger'" 
          :loading="reviewLoading" 
          @click="handleReviewSubmit"
        >
          {{ reviewType === 'approve' ? '确认通过' : '确认拒绝' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDate } from '@/utils/date'
import { getApplicationList, reviewApplication, getApplicationDetail } from '@/api/controller'

const loading = ref(false)
const reviewLoading = ref(false)
const applications = ref([])
const showDetailDialog = ref(false)
const showReviewDialog = ref(false)
const currentApplication = ref(null)
const reviewType = ref('approve')

const filterForm = reactive({
  status: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const reviewForm = reactive({
  notes: ''
})

const statusMap = {
  pending: '待审核',
  reviewing: '审核中',
  approved: '已通过',
  rejected: '已拒绝'
}

const statusTypeMap = {
  pending: 'warning',
  reviewing: 'primary',
  approved: 'success',
  rejected: 'danger'
}

const getStatusText = (status) => statusMap[status] || status
const getStatusType = (status) => statusTypeMap[status] || ''

const fetchApplications = async () => {
  loading.value = true
  try {
    const res = await getApplicationList({
      page: pagination.page,
      pageSize: pagination.pageSize,
      status: filterForm.status
    })
    applications.value = res.data || []
    pagination.total = res.pagination?.total || 0
  } catch (error) {
    console.error('Fetch applications error:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchApplications()
}

const resetFilter = () => {
  filterForm.status = ''
  handleSearch()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  fetchApplications()
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchApplications()
}

const handleView = async (row) => {
  try {
    const res = await getApplicationDetail(row.id)
    currentApplication.value = res.data
    showDetailDialog.value = true
  } catch (error) {
    console.error('Get application detail error:', error)
  }
}

const handleApprove = (row) => {
  currentApplication.value = row
  reviewType.value = 'approve'
  reviewForm.notes = ''
  showReviewDialog.value = true
}

const handleReject = (row) => {
  currentApplication.value = row
  reviewType.value = 'reject'
  reviewForm.notes = ''
  showReviewDialog.value = true
}

const handleReviewSubmit = async () => {
  reviewLoading.value = true
  try {
    await reviewApplication(currentApplication.value.id, {
      status: reviewType.value === 'approve' ? 'approved' : 'rejected',
      reviewNotes: reviewForm.notes
    })
    ElMessage.success(reviewType.value === 'approve' ? '已通过申请' : '已拒绝申请')
    showReviewDialog.value = false
    fetchApplications()
  } catch (error) {
    console.error('Review application error:', error)
  } finally {
    reviewLoading.value = false
  }
}

onMounted(() => {
  fetchApplications()
})
</script>

<style scoped lang="scss">
.admin-applications {
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

  .applicant-info {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .applicant-detail {
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

  .application-detail {
    .detail-section {
      margin-top: 20px;
      
      h4 {
        margin: 0 0 8px;
        color: #606266;
        font-size: 14px;
      }
      
      p {
        margin: 0;
        padding: 12px;
        background: #f5f7fa;
        border-radius: 4px;
        color: #303133;
        line-height: 1.6;
      }
    }
  }
}
</style>
