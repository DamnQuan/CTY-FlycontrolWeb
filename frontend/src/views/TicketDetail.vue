<template>
  <div class="ticket-detail-page">
    <el-page-header @back="$router.back()" />
    
    <div v-if="ticket" class="ticket-content">
      <!-- 工单头部 -->
      <el-card class="ticket-header">
        <div class="header-top">
          <div class="ticket-info">
            <span class="ticket-no">{{ ticket.ticketNo }}</span>
            <h1 class="ticket-title">{{ ticket.title }}</h1>
          </div>
          <div class="ticket-tags">
            <el-tag :type="getTypeType(ticket.type)">{{ getTypeText(ticket.type) }}</el-tag>
            <el-tag :type="getPriorityType(ticket.priority)">{{ getPriorityText(ticket.priority) }}</el-tag>
            <el-tag :type="getStatusType(ticket.status)">{{ getStatusText(ticket.status) }}</el-tag>
          </div>
        </div>
        
        <el-divider />
        
        <div class="header-meta">
          <div class="meta-item">
            <span class="label">创建人：</span>
            <span class="value">{{ ticket.creator?.username }}</span>
          </div>
          <div class="meta-item">
            <span class="label">创建时间：</span>
            <span class="value">{{ formatDateTime(ticket.createdAt) }}</span>
          </div>
          <div class="meta-item">
            <span class="label">处理人：</span>
            <span class="value">{{ ticket.assignee?.username || '未分配' }}</span>
          </div>
          <div class="meta-item" v-if="ticket.resolvedAt">
            <span class="label">解决时间：</span>
            <span class="value">{{ formatDateTime(ticket.resolvedAt) }}</span>
          </div>
        </div>
      </el-card>

      <!-- 工单内容 -->
      <el-row :gutter="24">
        <el-col :xs="24" :lg="16">
          <el-card class="description-card">
            <template #header>
              <span>问题描述</span>
            </template>
            <div class="description">
              {{ ticket.description }}
            </div>
          </el-card>

          <!-- 处理结果 -->
          <el-card v-if="ticket.handlerName || ticket.closedAt || comments.length > 0" class="result-card">
            <template #header>
              <span>处理结果</span>
            </template>
            <div v-if="ticket.handlerName" class="result-item">
              <span class="label">处理人：</span>
              <span class="value">{{ ticket.handlerName }}</span>
            </div>
            <div v-if="ticket.handledAt" class="result-item">
              <span class="label">处理时间：</span>
              <span class="value">{{ formatDateTime(ticket.handledAt) }}</span>
            </div>
            <div v-if="ticket.closedAt" class="result-item">
              <span class="label">关闭时间：</span>
              <span class="value">{{ formatDateTime(ticket.closedAt) }}</span>
            </div>
            <!-- 显示回复内容 -->
            <div v-if="comments.length > 0" class="reply-content">
              <div class="label">回复内容：</div>
              <div v-for="comment in comments" :key="comment.id" class="comment-item">
                <div class="comment-header">
                  <span class="username">{{ comment.username }}</span>
                  <el-tag v-if="comment.userId !== ticket.creatorId" size="small" type="success">管理员</el-tag>
                  <span class="comment-time">{{ formatDateTime(comment.createdAt) }}</span>
                </div>
                <div class="comment-body">{{ comment.content }}</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <el-skeleton v-else :rows="10" animated />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { formatDateTime } from '@/utils/date'
import { getTicketDetail, getTicketComments } from '@/api/ticket'

const route = useRoute()
const router = useRouter()

const ticket = ref(null)
const comments = ref([])
const loading = ref(false)

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
  open: '未处理',
  processing: '处理中'
}

const typeTypeMap = {
  bug: 'danger',
  feature: 'success',
  support: 'primary',
  complaint: 'warning',
  other: 'info'
}

const priorityTypeMap = {
  urgent: 'danger',
  high: 'warning',
  medium: '',
  low: 'info'
}

const statusTypeMap = {
  open: 'danger',
  processing: 'success'
}

const getTypeText = (type) => typeMap[type] || type
const getPriorityText = (priority) => priorityMap[priority] || priority
const getStatusText = (status) => statusMap[status] || status
const getTypeType = (type) => typeTypeMap[type] || ''
const getPriorityType = (priority) => priorityTypeMap[priority] || ''
const getStatusType = (status) => statusTypeMap[status] || ''

const fetchTicketDetail = async () => {
  loading.value = true
  try {
    const res = await getTicketDetail(route.params.id)
    ticket.value = res.data
    // 获取评论/回复内容
    const commentsRes = await getTicketComments(route.params.id)
    comments.value = commentsRes.data || []
  } catch (error) {
    console.error('Fetch ticket detail error:', error)
    ElMessage.error('获取工单详情失败')
    router.push('/tickets')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchTicketDetail()
})
</script>

<style scoped lang="scss">
.ticket-detail-page {
  .ticket-content {
    margin-top: 24px;
  }

  .ticket-header {
    margin-bottom: 24px;
    
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      
      @media (max-width: 768px) {
        flex-direction: column;
      }
      
      .ticket-info {
        flex: 1;
        
        .ticket-no {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
          display: block;
        }
        
        .ticket-title {
          margin: 0;
          font-size: 20px;
          color: #303133;
        }
      }
      
      .ticket-tags {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }
    }
    
    .header-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      
      .meta-item {
        .label {
          color: #909399;
        }
        .value {
          color: #606266;
        }
      }
    }
  }

  .description-card {
    margin-bottom: 24px;
    
    .description {
      line-height: 1.8;
      color: #606266;
      white-space: pre-wrap;
    }
  }

  .comments-card {
    margin-top: 24px;
    
    .no-comments {
      text-align: center;
      color: #909399;
      padding: 40px 0;
    }
    
    .comments-list {
      .comment-item {
        padding: 16px 0;
        border-bottom: 1px solid #ebeef5;
        
        &:last-child {
          border-bottom: none;
        }
        
        .comment-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          
          .comment-author {
            display: flex;
            align-items: center;
            gap: 8px;
            
            .username {
              font-weight: 500;
              color: #303133;
            }
          }
          
          .comment-time {
            color: #909399;
            font-size: 12px;
          }
        }
        
        .comment-content {
          padding-left: 40px;
          color: #606266;
          line-height: 1.6;
          white-space: pre-wrap;
        }
      }
    }
    
    .reply-section {
      margin-top: 24px;
      padding-top: 24px;
      border-top: 1px solid #ebeef5;
      
      .el-button {
        margin-top: 12px;
        float: right;
      }
    }
  }

  .actions-card {
    margin-bottom: 24px;
    
    .action-buttons {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
  }

  .history-card {
    .history-item {
      .action {
        font-weight: 500;
        color: #303133;
      }
      
      .operator {
        color: #409eff;
        margin-left: 8px;
      }
      
      .details {
        margin: 4px 0 0;
        color: #909399;
        font-size: 12px;
      }
    }
  }
}
</style>
