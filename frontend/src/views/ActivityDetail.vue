<template>
  <div class="activity-detail-page">
    <el-page-header @back="$router.back()" />
    
    <div v-if="activity" class="activity-content">
      <!-- 活动头部 -->
      <el-card class="activity-header">
        <div class="header-main">
          <el-image 
            :src="activity.cover || '/default-activity.png'" 
            class="activity-cover"
            fit="cover"
          >
            <template #error>
              <div class="image-placeholder">
                <el-icon><Picture /></el-icon>
              </div>
            </template>
          </el-image>
          <div class="header-info">
            <div class="title-section">
              <h1>{{ activity.title }}</h1>
              <el-tag :type="getStatusType(activity.status)">
                {{ getStatusText(activity.status) }}
              </el-tag>
            </div>
            <div class="meta-section">
              <p>
                <el-icon><User /></el-icon>
                组织者：{{ activity.organizer?.username }}
              </p>
              <p>
                <el-icon><Clock /></el-icon>
                开始时间：{{ formatDateTime(activity.startTime) }}
              </p>
              <p>
                <el-icon><Timer /></el-icon>
                结束时间：{{ formatDateTime(activity.endTime) }}
              </p>
              <p v-if="activity.location">
                <el-icon><Location /></el-icon>
                地点：{{ activity.location }}
              </p>
            </div>
            <div class="action-section">
              <el-button 
                type="primary" 
                size="large"
                :disabled="!canRegister"
                @click="handleRegister"
              >
                {{ registerButtonText }}
              </el-button>
              <span class="participant-count">
                {{ activity.participants?.length || 0 }}
                <span v-if="activity.maxParticipants">/{{ activity.maxParticipants }}</span>
                人已报名
              </span>
            </div>
          </div>
        </div>
      </el-card>

      <!-- 活动详情 -->
      <el-row :gutter="24">
        <el-col :xs="24" :lg="16">
          <el-card class="detail-card">
            <template #header>
              <span>活动详情</span>
            </template>
            <div class="description">
              {{ activity.description }}
            </div>
          </el-card>
        </el-col>
        
        <el-col :xs="24" :lg="8">
          <el-card class="participants-card">
            <template #header>
              <span>报名人员 ({{ activity.participants?.length || 0 }})</span>
            </template>
            <div class="participant-list">
              <div 
                v-for="p in activity.participants" 
                :key="p.user?._id"
                class="participant-item"
              >
                <el-avatar :size="32" :src="p.user?.avatar">
                  <el-icon><UserFilled /></el-icon>
                </el-avatar>
                <span class="participant-name">{{ p.user?.username }}</span>
                <el-tag size="small" :type="getParticipantStatusType(p.status)">
                  {{ getParticipantStatusText(p.status) }}
                </el-tag>
              </div>
              <el-empty 
                v-if="!activity.participants?.length" 
                description="暂无报名人员"
                :image-size="60"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-skeleton v-else :rows="10" animated />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '@/utils/date'
import { getActivityDetail, registerActivity } from '@/api/activity'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activity = ref(null)
const loading = ref(false)

const statusMap = {
  draft: '草稿',
  published: '已发布',
  ongoing: '进行中',
  completed: '已结束',
  cancelled: '已取消'
}

const statusTypeMap = {
  draft: 'info',
  published: 'success',
  ongoing: 'primary',
  completed: '',
  cancelled: 'danger'
}

const participantStatusMap = {
  registered: '已报名',
  attended: '已参加',
  absent: '缺席',
  cancelled: '已取消'
}

const participantStatusTypeMap = {
  registered: 'success',
  attended: 'primary',
  absent: 'danger',
  cancelled: 'info'
}

const getStatusText = (status) => statusMap[status] || status
const getStatusType = (status) => statusTypeMap[status] || ''
const getParticipantStatusText = (status) => participantStatusMap[status] || status
const getParticipantStatusType = (status) => participantStatusTypeMap[status] || ''

const isRegistered = computed(() => {
  if (!userStore.isLoggedIn || !activity.value?.participants) return false
  return activity.value.participants.some(
    p => p.user?._id === userStore.userInfo?._id && p.status === 'registered'
  )
})

const canRegister = computed(() => {
  if (!userStore.isLoggedIn) return false
  if (activity.value?.status !== 'published') return false
  if (isRegistered.value) return false
  if (activity.value?.requireController && userStore.userInfo?.role !== 'controller') return false
  if (activity.value?.maxParticipants && 
      activity.value?.participants?.length >= activity.value?.maxParticipants) return false
  return true
})

const registerButtonText = computed(() => {
  if (!userStore.isLoggedIn) return '请先登录'
  if (isRegistered.value) return '已报名'
  if (activity.value?.status !== 'published') return '报名未开始'
  if (activity.value?.requireController && userStore.userInfo?.role !== 'controller') {
    return '仅限管制员'
  }
  if (activity.value?.maxParticipants && 
      activity.value?.participants?.length >= activity.value?.maxParticipants) {
    return '名额已满'
  }
  return '立即报名'
})

const fetchActivityDetail = async () => {
  loading.value = true
  try {
    const res = await getActivityDetail(route.params.id)
    activity.value = res.data
  } catch (error) {
    console.error('Fetch activity detail error:', error)
    ElMessage.error('获取活动详情失败')
    router.push('/activities')
  } finally {
    loading.value = false
  }
}

const handleRegister = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  try {
    await ElMessageBox.confirm('确定要报名此活动吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'info'
    })
    
    await registerActivity(activity.value._id)
    ElMessage.success('报名成功')
    fetchActivityDetail()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Register error:', error)
    }
  }
}

onMounted(() => {
  fetchActivityDetail()
})
</script>

<style scoped lang="scss">
.activity-detail-page {
  .activity-content {
    margin-top: 24px;
  }

  .activity-header {
    margin-bottom: 24px;
    
    .header-main {
      display: flex;
      gap: 24px;
      
      @media (max-width: 768px) {
        flex-direction: column;
      }
      
      .activity-cover {
        width: 300px;
        height: 200px;
        border-radius: 8px;
        flex-shrink: 0;
        
        @media (max-width: 768px) {
          width: 100%;
        }
      }
      
      .image-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #f5f7fa;
        
        .el-icon {
          font-size: 48px;
          color: #c0c4cc;
        }
      }
      
      .header-info {
        flex: 1;
        
        .title-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
          
          h1 {
            margin: 0;
            font-size: 24px;
            color: #303133;
          }
        }
        
        .meta-section {
          margin-bottom: 24px;
          
          p {
            display: flex;
            align-items: center;
            gap: 8px;
            margin: 8px 0;
            color: #606266;
            font-size: 14px;
            
            .el-icon {
              color: #909399;
            }
          }
        }
        
        .action-section {
          display: flex;
          align-items: center;
          gap: 16px;
          
          .participant-count {
            color: #909399;
            font-size: 14px;
          }
        }
      }
    }
  }

  .detail-card {
    margin-bottom: 24px;
    
    .description {
      line-height: 1.8;
      color: #606266;
      white-space: pre-wrap;
    }
  }

  .participants-card {
    .participant-list {
      .participant-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 8px 0;
        border-bottom: 1px solid #ebeef5;
        
        &:last-child {
          border-bottom: none;
        }
        
        .participant-name {
          flex: 1;
          font-size: 14px;
          color: #606266;
        }
      }
    }
  }
}
</style>
