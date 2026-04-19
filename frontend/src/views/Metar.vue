<template>
  <div class="metar-page">
    <el-card shadow="hover" class="search-card">
      <template #header>
        <div class="card-header">
          <span class="title">
            <el-icon><PartlyCloudy /></el-icon>
            METAR 报文查询
          </span>
        </div>
      </template>

      <div class="search-form">
        <el-input
          v-model="icaoCode"
          placeholder="请输入机场ICAO代码 (如: ZBAA)"
          maxlength="4"
          show-word-limit
          clearable
          @keyup.enter="fetchMetar"
          class="icao-input"
        >
          <template #prepend>
            <el-icon><Location /></el-icon>
          </template>
        </el-input>
        <el-button 
          type="primary" 
          :loading="loading" 
          @click="fetchMetar"
          size="large"
        >
          <el-icon><Search /></el-icon>
          查询
        </el-button>
      </div>
    </el-card>

    <el-card v-if="metarData" shadow="hover" class="result-card">
      <template #header>
        <div class="result-header">
          <span class="airport-name">{{ metarData.icao }}</span>
          <el-tag type="info" size="small">{{ metarData.source }}</el-tag>
        </div>
      </template>

      <div class="metar-content">
        <div class="metar-raw">
          <div class="label">原始报文</div>
          <div class="content">{{ metarData.metar }}</div>
        </div>
        
        <div class="metar-time">
          <el-icon><Clock /></el-icon>
          <span>获取时间: {{ formatDateTime(metarData.fetchedAt) }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { PartlyCloudy, Location, Search, Clock } from '@element-plus/icons-vue'
import { getMetar } from '@/api/metar'
import { formatDateTime } from '@/utils/date'

const icaoCode = ref('')
const loading = ref(false)
const metarData = ref(null)

const fetchMetar = async () => {
  const code = icaoCode.value.trim().toUpperCase()
  
  if (!code) {
    ElMessage.warning('请输入机场ICAO代码')
    return
  }
  
  if (code.length !== 4) {
    ElMessage.warning('ICAO代码必须是4位字母')
    return
  }
  
  loading.value = true
  try {
    const res = await getMetar(code)
    if (res.success) {
      metarData.value = res.data
    } else {
      ElMessage.error(res.message || '获取METAR数据失败')
    }
  } catch (error) {
    console.error('获取METAR失败:', error)
    ElMessage.error('获取METAR数据失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.metar-page {
  max-width: 800px;
  margin: 0 auto;

  .search-card {
    margin-bottom: 20px;

    .card-header {
      .title {
        font-size: 18px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 8px;

        .el-icon {
          color: #667eea;
        }
      }
    }

    .search-form {
      display: flex;
      gap: 15px;

      .icao-input {
        flex: 1;
      }
    }
  }

  .result-card {
    margin-bottom: 20px;

    .result-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .airport-name {
        font-size: 24px;
        font-weight: 700;
        color: #303133;
      }
    }

    .metar-content {
      .metar-raw {
        background: #f5f7fa;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 15px;

        .label {
          font-size: 12px;
          color: #909399;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .content {
          font-family: 'Courier New', monospace;
          font-size: 16px;
          color: #303133;
          line-height: 1.6;
          word-break: break-all;
        }
      }

      .metar-time {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #909399;
        font-size: 13px;

        .el-icon {
          font-size: 14px;
        }
      }
    }
  }
}

@media (max-width: 768px) {
  .metar-page {
    .search-form {
      flex-direction: column;
    }
  }
}
</style>
