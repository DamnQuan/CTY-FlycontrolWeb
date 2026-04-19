<template>
  <div class="admin-dashboard">
    <h1>管理首页</h1>

    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #e6f7ff; color: #1890ff;">
            <el-icon><User /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.users?.total || 0 }}</div>
            <div class="stat-label">总用户数</div>
            <div class="stat-change">
              今日新增 +{{ stats.users?.newToday || 0 }}
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #f6ffed; color: #52c41a;">
            <el-icon><Calendar /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.activities?.total || 0 }}</div>
            <div class="stat-label">活动总数</div>
            <div class="stat-change">
              进行中 {{ stats.activities?.ongoing || 0 }}
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #fff7e6; color: #fa8c16;">
            <el-icon><Tickets /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.tickets?.total || 0 }}</div>
            <div class="stat-label">工单总数</div>
            <div class="stat-change">
              待处理 {{ stats.tickets?.pending || 0 }}
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="6">
        <el-card class="stat-card">
          <div class="stat-icon" style="background: #fff1f0; color: #f5222d;">
            <el-icon><UserFilled /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-value">{{ stats.applications?.pending || 0 }}</div>
            <div class="stat-label">待审核申请</div>
            <el-button 
              v-if="stats.applications?.pending > 0"
              type="primary" 
              link
              @click="$router.push('/admin/controller-applications')"
            >
              去审核
            </el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近动态 -->
    <el-row :gutter="20">
      <el-col :xs="24" :lg="12">
        <el-card class="recent-card">
          <template #header>
            <div class="card-header">
              <span>最新活动</span>
              <el-button link type="primary" @click="$router.push('/admin/activities')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="recentActivities" stripe>
            <el-table-column prop="title" label="活动名称" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="80">
              <template #default="{ row }">
                <el-tag size="small">{{ getActivityType(row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="createdAt" label="创建时间" width="140">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
      
      <el-col :xs="24" :lg="12">
        <el-card class="recent-card">
          <template #header>
            <div class="card-header">
              <span>最新工单</span>
              <el-button link type="primary" @click="$router.push('/admin/tickets')">
                查看全部
              </el-button>
            </div>
          </template>
          <el-table :data="recentTickets" stripe>
            <el-table-column prop="ticketNo" label="工单号" width="120" />
            <el-table-column prop="title" label="标题" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { formatDate } from '@/utils/date'
import { getDashboardStats } from '@/api/admin'

const stats = ref({})
const recentActivities = ref([])
const recentTickets = ref([])

const activityTypeMap = {
  training: '培训',
  exam: '考试',
  event: '活动',
  meeting: '会议',
  other: '其他'
}

const statusMap = {
  open: '待处理',
  processing: '处理中',
  pending: '待确认',
  resolved: '已解决',
  closed: '已关闭'
}

const statusTypeMap = {
  open: 'danger',
  processing: 'warning',
  pending: 'info',
  resolved: 'success',
  closed: ''
}

const getActivityType = (type) => activityTypeMap[type] || type
const getStatusText = (status) => statusMap[status] || status
const getStatusType = (status) => statusTypeMap[status] || ''

const fetchDashboardStats = async () => {
  try {
    const res = await getDashboardStats()
    stats.value = res.data?.stats || {}
    recentActivities.value = res.data?.recent?.activities || []
    recentTickets.value = res.data?.recent?.tickets || []
  } catch (error) {
    console.error('Fetch dashboard stats error:', error)
  }
}

onMounted(() => {
  fetchDashboardStats()
})
</script>

<style scoped lang="scss">
.admin-dashboard {
  h1 {
    margin: 0 0 24px;
    font-size: 24px;
    color: #303133;
  }

  .stats-row {
    margin-bottom: 24px;
    
    .stat-card {
      display: flex;
      align-items: center;
      padding: 20px;
      
      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 16px;
        
        .el-icon {
          font-size: 28px;
        }
      }
      
      .stat-info {
        flex: 1;
        
        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
          line-height: 1;
          margin-bottom: 4px;
        }
        
        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 4px;
        }
        
        .stat-change {
          font-size: 12px;
          color: #67c23a;
        }
      }
    }
  }

  .recent-card {
    margin-bottom: 24px;
    
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
  }
}
</style>
