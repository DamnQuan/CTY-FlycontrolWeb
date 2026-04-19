<template>
  <div class="admin-activities">
    <div class="page-header">
      <h1>活动管理</h1>
      <el-button type="primary" @click="showCreateDialog = true">
        <el-icon><Plus /></el-icon>创建活动
      </el-button>
    </div>

    <!-- 活动列表 -->
    <el-card>
      <el-table :data="activities" v-loading="loading" stripe>
        <el-table-column type="index" width="50" />
        <el-table-column label="活动封面" width="120">
          <template #default="{ row }">
            <el-image 
              :src="row.coverImage || '/default-activity.png'" 
              style="width: 100px; height: 60px; object-fit: cover;"
              fit="cover"
            />
          </template>
        </el-table-column>
        <el-table-column prop="title" label="活动名称" min-width="150" show-overflow-tooltip />
        <el-table-column label="出发/到达" width="120">
          <template #default="{ row }">
            <div v-if="row.departureAirport && row.arrivalAirport">
              {{ row.departureAirport }} → {{ row.arrivalAirport }}
            </div>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="startTime" label="活动时间" width="160">
          <template #default="{ row }">
            {{ formatDate(row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="distance" label="距离" width="100">
          <template #default="{ row }">
            {{ row.distance ? row.distance + ' 海里' : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="organizer" label="组织者" width="120">
          <template #default="{ row }">
            {{ row.organizer?.username }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
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

    <!-- 创建/编辑活动对话框 -->
    <el-dialog v-model="showDialog" :title="isEdit ? '编辑活动' : '创建活动'" width="700px">
      <el-form :model="form" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="活动名称">
              <el-input v-model="form.title" placeholder="请输入活动名称" />
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="活动封面">
              <el-input v-model="form.coverImage" placeholder="封面图片URL" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="活动时间">
              <el-input 
                v-model="form.startTime" 
                placeholder="格式: 2026-04-19 14:30:00"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="出发机场">
              <el-input v-model="form.departureAirport" placeholder="ICAO代码，如 ZBAA" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="到达机场">
              <el-input v-model="form.arrivalAirport" placeholder="ICAO代码，如 ZSPD" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="航路">
              <el-input v-model="form.route" placeholder="请输入航路" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="航路距离">
              <el-input-number v-model="form.distance" :min="0" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="NOTAMS">
              <el-input v-model="form.notams" type="textarea" :rows="3" placeholder="请输入NOTAMS信息" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="活动描述">
              <el-input v-model="form.description" type="textarea" :rows="4" placeholder="请输入活动描述" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { formatDate } from '@/utils/date'
import { getActivityList, createActivity, updateActivity, deleteActivity } from '@/api/activity'

const loading = ref(false)
const submitting = ref(false)
const activities = ref([])
const showDialog = ref(false)
const showCreateDialog = ref(false)
const isEdit = ref(false)
const currentId = ref(null)

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const form = reactive({
  title: '',
  coverImage: '',
  startTime: '',
  departureAirport: '',
  arrivalAirport: '',
  route: '',
  distance: 0,
  notams: '',
  description: ''
})

const fetchActivities = async () => {
  loading.value = true
  try {
    const res = await getActivityList({
      page: pagination.page,
      pageSize: pagination.pageSize
    })
    activities.value = res.data || []
    pagination.total = res.pagination?.total || 0
  } catch (error) {
    console.error('获取活动列表失败:', error)
    ElMessage.error('获取活动列表失败')
  } finally {
    loading.value = false
  }
}

const handleEdit = (row) => {
  isEdit.value = true
  currentId.value = row.id
  Object.assign(form, {
    title: row.title || '',
    coverImage: row.coverImage || '',
    startTime: row.startTime || '',
    departureAirport: row.departureAirport || '',
    arrivalAirport: row.arrivalAirport || '',
    route: row.route || '',
    distance: row.distance || 0,
    notams: row.notams || '',
    description: row.description || ''
  })
  showDialog.value = true
}

const handleDelete = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除此活动吗？', '提示', {
      type: 'warning'
    })
    await deleteActivity(row.id)
    ElMessage.success('删除成功')
    fetchActivities()
  } catch (error) {
    if (error !== 'cancel') {
      console.error('删除活动失败:', error)
      ElMessage.error('删除失败')
    }
  }
}

const handleSubmit = async () => {
  if (!form.title) {
    ElMessage.warning('请输入活动名称')
    return
  }

  submitting.value = true
  try {
    const data = { ...form }
    
    if (isEdit.value) {
      await updateActivity(currentId.value, data)
      ElMessage.success('更新成功')
    } else {
      await createActivity(data)
      ElMessage.success('创建成功')
    }
    showDialog.value = false
    fetchActivities()
  } catch (error) {
    console.error('保存活动失败:', error)
    ElMessage.error('保存失败')
  } finally {
    submitting.value = false
  }
}

const handlePageChange = (page) => {
  pagination.page = page
  fetchActivities()
}

const handleSizeChange = (size) => {
  pagination.pageSize = size
  pagination.page = 1
  fetchActivities()
}

// 监听创建对话框
watch(() => showCreateDialog.value, (val) => {
  if (val) {
    isEdit.value = false
    currentId.value = null
    Object.assign(form, {
      title: '',
      coverImage: '',
      startTime: '',
      departureAirport: '',
      arrivalAirport: '',
      route: '',
      distance: 0,
      notams: '',
      description: ''
    })
    showDialog.value = true
    showCreateDialog.value = false
  }
})

onMounted(() => {
  fetchActivities()
})
</script>

<style scoped lang="scss">
.admin-activities {
  .page-header {
    margin-bottom: 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h1 {
      margin: 0;
      font-size: 24px;
      color: #303133;
    }
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: flex-end;
  }

  .form-tip {
    margin-left: 8px;
    color: #909399;
    font-size: 12px;
  }
}
</style>
