<template>
  <div class="controller-apply-page">
    <div class="page-header">
      <h1>管制员申请</h1>
      <p>申请成为CTY垂天云认证管制员</p>
    </div>

    <!-- 申请状态卡片 -->
    <el-card v-if="latestApplication" class="status-card">
      <template #header>
        <span>申请状态</span>
      </template>
      <div class="status-content">
        <div class="status-info">
          <el-tag :type="getStatusType(latestApplication.status)" size="large">
            {{ getStatusText(latestApplication.status) }}
          </el-tag>
          <span class="apply-time">
            申请时间：{{ formatDateTime(latestApplication.submittedAt) }}
          </span>
        </div>
        <div v-if="latestApplication.reviewNotes" class="review-notes">
          <h4>审核备注</h4>
          <p>{{ latestApplication.reviewNotes }}</p>
        </div>
        <div v-if="latestApplication.status === 'pending'" class="status-actions">
          <el-button type="danger" @click="handleCancel">
            取消申请
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 申请条件 -->
    <el-row :gutter="24">
      <el-col :xs="24" :lg="latestApplication ? 24 : 16">
        <el-card class="requirements-card">
          <template #header>
            <span>申请条件</span>
          </template>
          <div class="requirements-list">
            <div class="requirement-item">
              <el-icon class="check-icon" color="#67c23a"><CircleCheck /></el-icon>
              <div class="requirement-content">
                <h4>拥有对管制工作的热爱</h4>
                <p>对空中交通管制工作有浓厚的兴趣和热情</p>
              </div>
            </div>
            <div class="requirement-item">
              <el-icon class="check-icon" color="#67c23a"><CircleCheck /></el-icon>
              <div class="requirement-content">
                <h4>注册满48小时</h4>
                <p>在本平台注册时间超过48小时</p>
              </div>
            </div>
            <div class="requirement-item">
              <el-icon class="check-icon" color="#67c23a"><CircleCheck /></el-icon>
              <div class="requirement-content">
                <h4>机组的中英文陆空能力</h4>
                <p>具备良好的中英文无线电通话能力</p>
              </div>
            </div>
            <div class="requirement-item">
              <el-icon class="check-icon" color="#67c23a"><CircleCheck /></el-icon>
              <div class="requirement-content">
                <h4>了解管制员的规章制度</h4>
                <p>熟悉并理解空中交通管制相关规章制度</p>
              </div>
            </div>
            <div class="requirement-item">
              <el-icon class="check-icon" color="#67c23a"><CircleCheck /></el-icon>
              <div class="requirement-content">
                <h4>简单的METAR报文解读能力</h4>
                <p>能够基本理解和解读METAR气象报文</p>
              </div>
            </div>
            <div class="requirement-item">
              <el-icon class="check-icon" color="#67c23a"><CircleCheck /></el-icon>
              <div class="requirement-content">
                <h4>eAIP航图识读能力</h4>
                <p>具备阅读和理解电子航空情报资料的能力</p>
              </div>
            </div>
            <div class="requirement-item">
              <el-icon class="check-icon" color="#67c23a"><CircleCheck /></el-icon>
              <div class="requirement-content">
                <h4>了解RVSM高度层</h4>
                <p>熟悉缩小垂直间隔空域的高度层配备</p>
              </div>
            </div>
            <div class="requirement-item">
              <el-icon class="check-icon" color="#67c23a"><CircleCheck /></el-icon>
              <div class="requirement-content">
                <h4>了解飞行情报区及空域的运行规范</h4>
                <p>熟悉飞行情报区划分和空域运行规则</p>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 申请表单 -->
      <el-col v-if="!latestApplication" :xs="24" :lg="8">
        <el-card class="apply-form-card">
          <template #header>
            <span>提交申请</span>
          </template>
          <el-form :model="form" label-position="top">
            <el-form-item label="CID">
              <el-input v-model="form.cid" disabled placeholder="自动填充" />
            </el-form-item>
            <el-form-item label="电子邮箱">
              <el-input v-model="form.email" placeholder="请输入邮箱地址" />
            </el-form-item>
            <el-form-item label="管制等级">
              <el-select v-model="form.rating" placeholder="请选择等级" style="width: 100%;">
                <el-option label="S1 - 地面管制员" value="S1" />
                <el-option label="S2 - 塔台管制员" value="S2" />
                <el-option label="S3 - 进近管制员" value="S3" />
                <el-option label="C1 - 区域管制员" value="C1" />
                <el-option label="C2 - 高级区域管制员" value="C2" />
                <el-option label="C3 - 资深区域管制员" value="C3" />
                <el-option label="I1 - 教员" value="I1" />
                <el-option label="I2 - 高级教员" value="I2" />
                <el-option label="I3 - 资深教员" value="I3" />
                <el-option label="SUP - 监督员" value="SUP" />
                <el-option label="ADM - 管理员" value="ADM" />
              </el-select>
            </el-form-item>
            <el-form-item label="管制经验">
              <el-input 
                v-model="form.experience" 
                type="textarea"
                :rows="3"
                placeholder="请简述您的管制经验"
              />
            </el-form-item>
            <el-form-item label="申请动机">
              <el-input 
                v-model="form.motivation" 
                type="textarea"
                :rows="3"
                placeholder="请说明您为什么想加入CTY垂天云"
              />
            </el-form-item>
            <el-form-item>
              <el-button 
                type="primary" 
                :loading="submitting"
                style="width: 100%;"
                @click="handleSubmit"
              >
                提交申请
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 申请历史 -->
    <el-card v-if="applicationHistory.length > 0" class="history-card">
      <template #header>
        <span>申请历史</span>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="app in applicationHistory"
          :key="app.id"
          :type="getTimelineType(app.status)"
          :timestamp="formatDateTime(app.submittedAt)"
        >
          <div class="history-item">
            <div class="history-header">
              <span class="cid">CID: {{ app.cid }}</span>
              <el-tag :type="getStatusType(app.status)" size="small">
                {{ getStatusText(app.status) }}
              </el-tag>
            </div>
            <div class="history-info">
              <p>等级：{{ app.rating }}</p>
              <p v-if="app.reviewedAt">
                审核时间：{{ formatDateTime(app.reviewedAt) }}
              </p>
              <p v-if="app.reviewNotes" class="review-notes">
                备注：{{ app.reviewNotes }}
              </p>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { formatDateTime } from '@/utils/date'
import { submitApplication, cancelApplication, getMyApplications } from '@/api/controller'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const submitting = ref(false)
const latestApplication = ref(null)
const applicationHistory = ref([])

const form = reactive({
  cid: '',
  email: '',
  rating: '',
  experience: '',
  motivation: ''
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

const getTimelineType = (status) => {
  const typeMap = {
    approved: 'success',
    rejected: 'danger',
    pending: 'warning',
    reviewing: 'primary'
  }
  return typeMap[status] || ''
}

const fetchApplications = async () => {
  loading.value = true
  try {
    const res = await getMyApplications()
    const apps = res.data || []
    applicationHistory.value = apps
    
    // 找到最新的进行中的申请
    const pending = apps.find(a => ['pending', 'reviewing'].includes(a.status))
    latestApplication.value = pending || null
  } catch (error) {
    console.error('Fetch applications error:', error)
  } finally {
    loading.value = false
  }
}

const handleSubmit = async () => {
  // 自动填充 CID
  form.cid = userStore.userInfo?.cid || ''

  // 表单验证
  if (!form.cid) {
    ElMessage.warning('无法获取您的CID，请重新登录')
    return
  }

  if (!form.email || !form.rating) {
    ElMessage.warning('请填写完整信息')
    return
  }

  if (!form.experience || !form.motivation) {
    ElMessage.warning('请填写管制经验和申请动机')
    return
  }

  submitting.value = true
  try {
    await submitApplication(form)
    ElMessage.success('申请提交成功')
    fetchApplications()
  } catch (error) {
    console.error('Submit application error:', error)
  } finally {
    submitting.value = false
  }
}

const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确定要取消此申请吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await cancelApplication(latestApplication.value.id)
    ElMessage.success('申请已取消')
    fetchApplications()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Cancel application error:', error)
    }
  }
}

onMounted(() => {
  fetchApplications()
})
</script>

<style scoped lang="scss">
.controller-apply-page {
  .page-header {
    text-align: center;
    margin-bottom: 32px;
    
    h1 {
      font-size: 28px;
      color: #303133;
      margin: 0 0 8px;
    }
    
    p {
      color: #909399;
      margin: 0;
    }
  }

  .status-card {
    margin-bottom: 24px;
    
    .status-content {
      .status-info {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 16px;
        
        .apply-time {
          color: #909399;
        }
      }
      
      .review-notes {
        background: #f5f7fa;
        padding: 16px;
        border-radius: 4px;
        margin-bottom: 16px;
        
        h4 {
          margin: 0 0 8px;
          color: #606266;
        }
        
        p {
          margin: 0;
          color: #303133;
        }
      }
    }
  }

  .requirements-card {
    margin-bottom: 24px;
    
    .requirements-list {
      .requirement-item {
        display: flex;
        gap: 16px;
        padding: 20px 0;
        border-bottom: 1px solid #ebeef5;
        
        &:last-child {
          border-bottom: none;
        }
        
        .check-icon {
          font-size: 24px;
          flex-shrink: 0;
        }
        
        .requirement-content {
          h4 {
            margin: 0 0 4px;
            font-size: 16px;
            color: #303133;
          }
          
          p {
            margin: 0;
            color: #909399;
            font-size: 14px;
          }
        }
      }
    }
  }

  .apply-form-card {
    margin-bottom: 24px;
  }

  .history-card {
    .history-item {
      .history-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        
        .cid {
          font-weight: 500;
          color: #303133;
        }
      }
      
      .history-info {
        p {
          margin: 4px 0;
          color: #606266;
          font-size: 13px;
        }
        
        .review-notes {
          color: #909399;
          margin-top: 8px;
        }
      }
    }
  }
}
</style>
