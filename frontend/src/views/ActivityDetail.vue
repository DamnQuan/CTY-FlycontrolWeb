<template>
  <div class="activity-detail-page">
    <el-page-header @back="$router.back()" />
    
    <div v-if="activity" class="activity-content">
      <!-- 活动头部 -->
      <el-card class="activity-header">
        <div class="header-main">
          <el-image 
            :src="activity.coverImage || '/default-activity.png'" 
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
                组织者：{{ activity.organizer?.username || activity.organizerName }}
              </p>
              <p>
                <el-icon><Clock /></el-icon>
                开始时间：{{ formatDateTime(activity.startTime) }}
              </p>
              <p v-if="activity.departureAirport">
                <el-icon><Location /></el-icon>
                出发机场：{{ activity.departureAirport }}
              </p>
              <p v-if="activity.arrivalAirport">
                <el-icon><Location /></el-icon>
                到达机场：{{ activity.arrivalAirport }}
              </p>
              <p v-if="activity.distance">
                <el-icon><Compass /></el-icon>
                航路距离：{{ activity.distance }} 海里
              </p>
            </div>
            <div class="action-section">
              <el-button 
                v-if="!isRegistered"
                type="primary" 
                size="large"
                :disabled="!canRegister"
                @click="openRegisterDialog"
              >
                {{ registerButtonText }}
              </el-button>
              <el-button 
                v-else
                type="danger" 
                size="large"
                @click="handleCancelRegister"
              >
                取消报名
              </el-button>
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
              {{ activity.description || '暂无描述' }}
            </div>
            <div v-if="activity.route" class="route-info">
              <h4>航路</h4>
              <p>{{ activity.route }}</p>
            </div>
            <div v-if="activity.notams" class="notams-info">
              <h4>NOTAMS</h4>
              <p>{{ activity.notams }}</p>
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
                :key="p.id"
                class="participant-item"
              >
                <el-avatar :size="32" :src="p.user?.avatar">
                  <el-icon><UserFilled /></el-icon>
                </el-avatar>
                <div class="participant-info">
                  <span class="participant-name">{{ p.user?.username }}</span>
                  <span v-if="p.registrationType === 'controller'" class="participant-detail">
                    席位: {{ p.position }} | 频率: {{ p.frequency }} | CID: {{ p.cid }}
                  </span>
                  <span v-else-if="p.registrationType === 'pilot'" class="participant-detail">
                    呼号: {{ p.callsign }} | 机型: {{ p.aircraft }} | CID: {{ p.cid }}
                  </span>
                </div>
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

    <!-- 报名对话框 -->
    <el-dialog v-model="showRegisterDialog" title="活动报名" width="500px">
      <el-form :model="registerForm" label-width="100px">
        <el-form-item label="报名类型">
          <el-radio-group v-model="registerForm.registrationType">
            <el-radio-button label="controller">管制报名</el-radio-button>
            <el-radio-button label="pilot">机组报名</el-radio-button>
          </el-radio-group>
        </el-form-item>
        
        <!-- 管制员报名字段 -->
        <template v-if="registerForm.registrationType === 'controller'">
          <el-form-item label="席位呼号" required>
            <el-input v-model="registerForm.position" placeholder="如：郑州塔台" />
          </el-form-item>
          <el-form-item label="频率" required>
            <el-input v-model="registerForm.frequency" placeholder="如：118.100" />
          </el-form-item>
          <el-form-item label="CID" required>
            <el-input v-model="registerForm.cid" placeholder="请输入您的CID" />
          </el-form-item>
        </template>
        
        <!-- 机组报名字段 -->
        <template v-if="registerForm.registrationType === 'pilot'">
          <el-form-item label="呼号" required>
            <el-input v-model="registerForm.callsign" placeholder="如：CCA1234" />
          </el-form-item>
          <el-form-item label="机型" required>
            <el-input v-model="registerForm.aircraft" placeholder="如：B738" />
          </el-form-item>
          <el-form-item label="CID" required>
            <el-input v-model="registerForm.cid" placeholder="请输入您的CID" />
          </el-form-item>
        </template>
      </el-form>
      <template #footer>
        <el-button @click="showRegisterDialog = false">取消</el-button>
        <el-button type="primary" :loading="registering" @click="submitRegister">确认报名</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '@/utils/date'
import { getActivityDetail, registerActivity, cancelActivity } from '@/api/activity'
import { useUserStore } from '@/stores/user'
import { Picture, User, Clock, Location, UserFilled, Compass } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const activity = ref(null)
const loading = ref(false)
const showRegisterDialog = ref(false)
const registering = ref(false)

const registerForm = ref({
  registrationType: 'controller',
  position: '',
  frequency: '',
  cid: '',
  callsign: '',
  aircraft: ''
})

const statusMap = {
  registering: '报名中',
  started: '已开始',
  ended: '已结束'
}

const statusTypeMap = {
  registering: 'success',
  started: 'primary',
  ended: 'info'
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
    p => p.user?.id === userStore.userInfo?.id && p.status === 'registered'
  )
})

const canRegister = computed(() => {
  if (!userStore.isLoggedIn) return false
  if (activity.value?.status !== 'registering') return false
  if (isRegistered.value) return false
  return true
})

const registerButtonText = computed(() => {
  if (!userStore.isLoggedIn) return '请先登录'
  if (isRegistered.value) return '已报名'
  if (activity.value?.status === 'started') return '活动已开始'
  if (activity.value?.status === 'ended') return '活动已结束'
  if (activity.value?.status !== 'registering') return '报名未开始'
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

const openRegisterDialog = () => {
  // 自动填充CID
  registerForm.value.cid = userStore.userInfo?.cid || ''
  showRegisterDialog.value = true
}

const handleCancelRegister = async () => {
  try {
    await ElMessageBox.confirm('确定要取消报名吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await cancelActivity(activity.value.id)
    ElMessage.success('取消报名成功')
    fetchActivityDetail()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Cancel register error:', error)
      ElMessage.error(error.response?.data?.message || '取消报名失败')
    }
  }
}

const submitRegister = async () => {
  if (!userStore.isLoggedIn) {
    ElMessage.warning('请先登录')
    router.push('/login')
    return
  }

  // 验证表单
  if (registerForm.value.registrationType === 'controller') {
    if (!registerForm.value.position) {
      ElMessage.warning('请输入席位呼号')
      return
    }
    if (!registerForm.value.frequency) {
      ElMessage.warning('请输入频率')
      return
    }
    if (!registerForm.value.cid) {
      ElMessage.warning('请输入CID')
      return
    }
  } else {
    if (!registerForm.value.callsign) {
      ElMessage.warning('请输入呼号')
      return
    }
    if (!registerForm.value.aircraft) {
      ElMessage.warning('请输入机型')
      return
    }
    if (!registerForm.value.cid) {
      ElMessage.warning('请输入CID')
      return
    }
  }

  registering.value = true
  try {
    await registerActivity(activity.value.id, registerForm.value)
    ElMessage.success('报名成功')
    showRegisterDialog.value = false
    // 重置表单
    registerForm.value = {
      registrationType: 'controller',
      position: '',
      frequency: '',
      cid: '',
      callsign: '',
      aircraft: ''
    }
    fetchActivityDetail()
  } catch (error) {
    console.error('Register error:', error)
    ElMessage.error(error.response?.data?.message || '报名失败')
  } finally {
    registering.value = false
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
        }
      }
    }
  }

  .detail-card {
    margin-bottom: 24px;
    
    .description {
      line-height: 1.8;
      color: #606266;
      margin-bottom: 20px;
    }
    
    .route-info, .notams-info {
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #ebeef5;
      
      h4 {
        margin: 0 0 12px 0;
        color: #303133;
      }
      
      p {
        margin: 0;
        color: #606266;
        line-height: 1.6;
      }
    }
  }

  .participants-card {
    .participant-list {
      .participant-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 12px 0;
        border-bottom: 1px solid #ebeef5;
        
        &:last-child {
          border-bottom: none;
        }
        
        .participant-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
          
          .participant-name {
            font-weight: 500;
            color: #303133;
          }
          
          .participant-detail {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
}
</style>
