<template>
  <div class="home-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon user">
              <el-icon :size="40"><UserFilled /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">注册用户</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon controller">
              <el-icon :size="40"><Microphone /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalControllers }}</div>
              <div class="stat-label">管制员</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :md="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-content">
            <div class="stat-icon activity">
              <el-icon :size="40"><Calendar /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalActivities }}</div>
              <div class="stat-label">活动数量</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 活动列表 -->
    <el-card class="activity-section" shadow="hover">
      <template #header>
        <div class="section-header">
          <span class="section-title">
            <el-icon><Calendar /></el-icon>
            近期活动
          </span>
          <el-button type="primary" text @click="$router.push('/activities')">
            查看全部
            <el-icon><ArrowRight /></el-icon>
          </el-button>
        </div>
      </template>
      
      <el-skeleton :rows="3" animated v-if="loading" />
      
      <div v-else-if="activities.length > 0" class="activity-list">
        <div 
          v-for="activity in activities.slice(0, 6)" 
          :key="activity.id" 
          class="activity-item"
          @click="goToActivity(activity.id)"
        >
          <div class="activity-image">
            <img :src="activity.coverImage || '/default-activity.jpg'" :alt="activity.title" />
            <div class="activity-status" :class="activity.status">
              {{ getStatusText(activity.status) }}
            </div>
          </div>
          <div class="activity-info">
            <h3 class="activity-title">{{ activity.title }}</h3>
            <div class="activity-meta">
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ formatDateTime(activity.startTime) }}
              </span>
              <span class="meta-item">
                <el-icon><Location /></el-icon>
                {{ activity.location || '待定' }}
              </span>
            </div>
            <div class="activity-footer">
              <el-tag size="small" :type="getTypeTag(activity.type)">
                {{ getTypeText(activity.type) }}
              </el-tag>
              <span class="organizer">组织者: {{ activity.organizerName }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <el-empty v-else description="暂无活动" />
    </el-card>

    <!-- ISFP 合作信息 -->
    <el-card class="cooperation-section" shadow="hover">
      <div class="cooperation-content">
        <div class="cooperation-logo">
          <el-icon :size="48"><Promotion /></el-icon>
        </div>
        <div class="cooperation-info">
          <h3 class="cooperation-title">合作伙伴</h3>
          <p class="cooperation-desc">
            本站点 METAR 报文数据由 
            <el-link type="primary" href="https://www.flyisfp.com" target="blank" :underline="false">
              ISFP云际模拟飞行连飞平台
            </el-link>
            提供支持
          </p>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  UserFilled, Microphone, Calendar, ArrowRight,
  Clock, Location, Promotion
} from '@element-plus/icons-vue'
import { getActivityList } from '@/api/activity'
import { getHomeStats } from '@/api/stats'
import { formatDateTime } from '@/utils/date'

const router = useRouter()
const loading = ref(false)
const activities = ref([])
const stats = ref({
  totalUsers: 0,
  totalControllers: 0,
  totalActivities: 0
})

const fetchActivities = async () => {
  loading.value = true
  try {
    const res = await getActivityList({ page: 1, pageSize: 6 })
    if (res.success) {
      activities.value = res.data.data || []
      stats.value.totalActivities = res.data.pagination?.total || 0
    }
  } catch (error) {
    console.error('获取活动列表失败:', error)
  } finally {
    loading.value = false
  }
}

const fetchStats = async () => {
  try {
    const res = await getHomeStats()
    if (res.success) {
      stats.value.totalUsers = res.data.totalUsers || 0
      stats.value.totalControllers = res.data.totalControllers || 0
      stats.value.totalActivities = res.data.totalActivities || 0
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const goToActivity = (id) => {
  router.push(`/activities/${id}`)
}

const getStatusText = (status) => {
  const map = {
    'draft': '草稿',
    'published': '报名中',
    'ongoing': '进行中',
    'completed': '已结束',
    'cancelled': '已取消'
  }
  return map[status] || status
}

const getTypeText = (type) => {
  const map = {
    'online': '连飞活动',
    'offline': '线下活动',
    'training': '培训活动',
    'exam': '考核活动'
  }
  return map[type] || type
}

const getTypeTag = (type) => {
  const map = {
    'online': 'primary',
    'offline': 'success',
    'training': 'warning',
    'exam': 'danger'
  }
  return map[type] || ''
}

onMounted(() => {
  fetchActivities()
  fetchStats()
})
</script>

<style scoped lang="scss">
.home-page {
  .stats-row {
    margin-bottom: 20px;
  }
  
  .stat-card {
    :deep(.el-card__body) {
      padding: 20px;
    }
    
    .stat-content {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    
    .stat-icon {
      width: 70px;
      height: 70px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
      
      &.user {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
      
      &.controller {
        background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
      }
      
      &.activity {
        background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
      }
    }
    
    .stat-info {
      flex: 1;
      
      .stat-value {
        font-size: 32px;
        font-weight: 700;
        color: #303133;
        line-height: 1.2;
      }
      
      .stat-label {
        font-size: 14px;
        color: #909399;
        margin-top: 4px;
      }
    }
  }
  
  .activity-section {
    :deep(.el-card__header) {
      padding: 15px 20px;
    }
    
    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      
      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #303133;
        display: flex;
        align-items: center;
        gap: 8px;
        
        .el-icon {
          color: #667eea;
        }
      }
    }
    
    .activity-list {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 20px;
    }
    
    .activity-item {
      border-radius: 12px;
      overflow: hidden;
      background: #fff;
      border: 1px solid #e4e7ed;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      }
      
      .activity-image {
        position: relative;
        height: 160px;
        overflow: hidden;
        
        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s;
        }
        
        &:hover img {
          transform: scale(1.05);
        }
        
        .activity-status {
          position: absolute;
          top: 10px;
          right: 10px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: #fff;
          
          &.draft {
            background: #909399;
          }
          
          &.published {
            background: #67c23a;
          }
          
          &.ongoing {
            background: #409eff;
          }
          
          &.completed {
            background: #909399;
          }
          
          &.cancelled {
            background: #f56c6c;
          }
        }
      }
      
      .activity-info {
        padding: 15px;
        
        .activity-title {
          font-size: 16px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 10px 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .activity-meta {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 10px;
          
          .meta-item {
            font-size: 13px;
            color: #606266;
            display: flex;
            align-items: center;
            gap: 6px;
            
            .el-icon {
              color: #909399;
            }
          }
        }
        
        .activity-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          
          .organizer {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }

  .cooperation-section {
    margin-top: 20px;
    
    :deep(.el-card__body) {
      padding: 30px;
    }
    
    .cooperation-content {
      display: flex;
      align-items: center;
      gap: 20px;
      
      .cooperation-logo {
        width: 80px;
        height: 80px;
        border-radius: 16px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        flex-shrink: 0;
      }
      
      .cooperation-info {
        flex: 1;
        
        .cooperation-title {
          font-size: 18px;
          font-weight: 600;
          color: #303133;
          margin: 0 0 8px 0;
        }
        
        .cooperation-desc {
          font-size: 14px;
          color: #606266;
          margin: 0;
          line-height: 1.6;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .home-page {
    .activity-list {
      grid-template-columns: 1fr !important;
    }
    
    .cooperation-content {
      flex-direction: column;
      text-align: center;
    }
  }
}
</style>
