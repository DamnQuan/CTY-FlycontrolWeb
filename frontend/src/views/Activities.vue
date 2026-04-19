<template>
  <div class="activities-page">
    <el-card shadow="hover">
      <template #header>
        <div class="page-header">
          <div class="header-left">
            <span class="page-title">活动列表</span>
            <el-radio-group v-model="filterStatus" size="small" @change="handleFilterChange">
              <el-radio-button label="">全部</el-radio-button>
              <el-radio-button label="published">报名中</el-radio-button>
              <el-radio-button label="ongoing">进行中</el-radio-button>
              <el-radio-button label="completed">已结束</el-radio-button>
            </el-radio-group>
          </div>
          <el-input
            v-model="searchKeyword"
            placeholder="搜索活动"
            clearable
            style="width: 250px"
            @keyup.enter="handleSearch"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
      </template>

      <el-skeleton :rows="5" animated v-if="loading" />

      <div v-else-if="activities.length > 0" class="activity-grid">
        <div
          v-for="activity in activities"
          :key="activity.id"
          class="activity-card"
          @click="goToDetail(activity.id)"
        >
          <div class="card-image">
            <img :src="activity.coverImage || '/default-activity.jpg'" :alt="activity.title" />
            <div class="card-status" :class="activity.status">
              {{ getStatusText(activity.status) }}
            </div>
          </div>
          <div class="card-content">
            <h3 class="card-title">{{ activity.title }}</h3>
            <div class="card-meta">
              <span class="meta-item">
                <el-icon><Clock /></el-icon>
                {{ formatDateTime(activity.startTime) }}
              </span>
              <span class="meta-item">
                <el-icon><Location /></el-icon>
                {{ activity.location || '待定' }}
              </span>
              <span class="meta-item">
                <el-icon><User /></el-icon>
                {{ activity.maxParticipants ? `${activity.currentParticipants || 0}/${activity.maxParticipants}` : '不限' }}人
              </span>
            </div>
            <div class="card-footer">
              <el-tag size="small" :type="getTypeTag(activity.type)">
                {{ getTypeText(activity.type) }}
              </el-tag>
              <span class="organizer">{{ activity.organizerName }}</span>
            </div>
          </div>
        </div>
      </div>

      <el-empty v-else description="暂无活动" />

      <div class="pagination-wrapper" v-if="pagination.total > pagination.pageSize">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[12, 24, 36]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Clock, Location, User } from '@element-plus/icons-vue'
import { getActivityList } from '@/api/activity'
import { formatDateTime } from '@/utils/date'

const router = useRouter()
const loading = ref(false)
const activities = ref([])
const searchKeyword = ref('')
const filterStatus = ref('')
const pagination = ref({
  page: 1,
  pageSize: 12,
  total: 0
})

const fetchActivities = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.value.page,
      pageSize: pagination.value.pageSize,
      keyword: searchKeyword.value
    }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    const res = await getActivityList(params)
    if (res.success) {
      activities.value = res.data || []
      pagination.value.total = res.pagination?.total || 0
    }
  } catch (error) {
    console.error('获取活动列表失败:', error)
    ElMessage.error('获取活动列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.value.page = 1
  fetchActivities()
}

const handleFilterChange = () => {
  pagination.value.page = 1
  fetchActivities()
}

const handlePageChange = (page) => {
  pagination.value.page = page
  fetchActivities()
}

const handleSizeChange = (size) => {
  pagination.value.pageSize = size
  pagination.value.page = 1
  fetchActivities()
}

const goToDetail = (id) => {
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
})
</script>

<style scoped lang="scss">
.activities-page {
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

  .activity-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
  }

  .activity-card {
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

    .card-image {
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

      .card-status {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        color: #fff;

        &.draft { background: #909399; }
        &.published { background: #67c23a; }
        &.ongoing { background: #409eff; }
        &.completed { background: #909399; }
        &.cancelled { background: #f56c6c; }
      }
    }

    .card-content {
      padding: 15px;

      .card-title {
        font-size: 16px;
        font-weight: 600;
        color: #303133;
        margin: 0 0 10px 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .card-meta {
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

      .card-footer {
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

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .activities-page {
    .page-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .activity-grid {
      grid-template-columns: 1fr;
    }
  }
}
</style>
