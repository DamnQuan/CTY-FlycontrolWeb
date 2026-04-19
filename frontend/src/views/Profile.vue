<template>
  <div class="profile-page">
    <el-row :gutter="20">
      <!-- 左侧个人信息卡片 -->
      <el-col :xs="24" :md="8">
        <el-card shadow="hover" class="profile-card">
          <div class="profile-header">
            <el-avatar :size="100" :src="userStore.userInfo?.avatar">
              <el-icon :size="50"><UserFilled /></el-icon>
            </el-avatar>
            <h3 class="username">{{ userStore.userInfo?.username }}</h3>

          </div>
          
          <div class="profile-info">
            <div class="info-item">
              <span class="label">邮箱</span>
              <span class="value">{{ userStore.userInfo?.email || '未设置' }}</span>
            </div>
            <div class="info-item">
              <span class="label">CID</span>
              <span class="value">{{ userStore.userInfo?.cid || '未绑定' }}</span>
            </div>
            <div class="info-item">
              <span class="label">等级</span>
              <span class="value">{{ userStore.userInfo?.rating || '无' }}</span>
            </div>
            <div class="info-item">
              <span class="label">注册时间</span>
              <span class="value">{{ formatDateTime(userStore.userInfo?.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="label">最后登录</span>
              <span class="value">{{ formatDateTime(userStore.userInfo?.lastLoginAt) }}</span>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 右侧编辑区域 -->
      <el-col :xs="24" :md="16">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <span class="title">编辑资料</span>
            </div>
          </template>

          <el-form
            ref="formRef"
            :model="form"
            :rules="rules"
            label-width="100px"
          >
            <el-form-item label="用户名">
              <el-input v-model="form.username" disabled />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="请输入邮箱" />
            </el-form-item>
            <el-form-item label="CID">
              <el-input v-model="form.cid" placeholder="请输入CID" />
            </el-form-item>
            <el-form-item label="头像">
              <el-upload
                class="avatar-uploader"
                action="/api/profile/avatar"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
              >
                <img v-if="form.avatar" :src="form.avatar" class="avatar" />
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSave">
                <el-icon><Check /></el-icon>
                保存修改
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <el-card shadow="hover" class="password-card">
          <template #header>
            <div class="card-header">
              <span class="title">修改密码</span>
            </div>
          </template>

          <el-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            label-width="100px"
          >
            <el-form-item label="当前密码" prop="currentPassword">
              <el-input
                v-model="passwordForm.currentPassword"
                type="password"
                placeholder="请输入当前密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="新密码" prop="newPassword">
              <el-input
                v-model="passwordForm.newPassword"
                type="password"
                placeholder="请输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="passwordForm.confirmPassword"
                type="password"
                placeholder="请再次输入新密码"
                show-password
              />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="changingPassword" @click="handleChangePassword">
                <el-icon><Lock /></el-icon>
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { UserFilled, Plus, Check, Lock } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'
import { getProfile, updateProfile, updateAvatar, changePassword } from '@/api/profile'
import { formatDateTime } from '@/utils/date'

const userStore = useUserStore()
const formRef = ref(null)
const passwordFormRef = ref(null)
const saving = ref(false)
const changingPassword = ref(false)

// 上传头像的请求头（动态获取token）
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`
}))

const form = ref({
  username: '',
  email: '',
  cid: '',
  avatar: ''
})

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const rules = {
  realName: [{ max: 50, message: '昵称最多50个字符', trigger: 'blur' }],
  email: [
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ]
}

const passwordRules = {
  currentPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (rule, value, callback) => {
        if (value !== passwordForm.value.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

const fetchProfile = async () => {
  try {
    const res = await getProfile()
    if (res.success) {
      const data = res.data
      form.value = {
        username: data.username,
        email: data.email || '',
        cid: data.cid || '',
        avatar: data.avatar || ''
      }
    }
  } catch (error) {
    console.error('获取个人信息失败:', error)
  }
}

const handleSave = async () => {
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return

  saving.value = true
  try {
    const res = await updateProfile({
      email: form.value.email,
      cid: form.value.cid
    })
    if (res.success) {
      ElMessage.success('保存成功')
      userStore.setUserInfo({ ...userStore.userInfo, ...form.value })
    } else {
      ElMessage.error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存失败:', error)
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

const handleChangePassword = async () => {
  const valid = await passwordFormRef.value.validate().catch(() => false)
  if (!valid) return

  changingPassword.value = true
  try {
    const res = await changePassword({
      currentPassword: passwordForm.value.currentPassword,
      newPassword: passwordForm.value.newPassword
    })
    if (res.success) {
      ElMessage.success('密码修改成功，请重新登录')
      passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
      setTimeout(() => {
        userStore.logout()
        window.location.href = '/login'
      }, 1500)
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  } catch (error) {
    console.error('修改密码失败:', error)
    ElMessage.error('修改失败')
  } finally {
    changingPassword.value = false
  }
}

const handleAvatarSuccess = (res) => {
  if (res.success) {
    form.value.avatar = res.data.url
    userStore.setUserInfo({ ...userStore.userInfo, avatar: res.data.url })
    ElMessage.success('头像上传成功')
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}

const beforeAvatarUpload = (file) => {
  const isJPG = file.type === 'image/jpeg'
  const isPNG = file.type === 'image/png'
  const isLt2M = file.size / 1024 / 1024 < 2

  if (!isJPG && !isPNG) {
    ElMessage.error('只支持 JPG/PNG 格式')
    return false
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB')
    return false
  }
  return true
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped lang="scss">
.profile-page {
  .profile-card {
    .profile-header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 1px solid #e4e7ed;
      margin-bottom: 20px;

      .username {
        margin: 15px 0 10px;
        font-size: 20px;
        font-weight: 600;
        color: #303133;
      }
    }

    .profile-info {
      .info-item {
        display: flex;
        justify-content: space-between;
        padding: 12px 0;
        border-bottom: 1px solid #f0f2f5;

        &:last-child {
          border-bottom: none;
        }

        .label {
          color: #909399;
          font-size: 14px;
        }

        .value {
          color: #606266;
          font-size: 14px;
        }
      }
    }
  }

  .card-header {
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
    }
  }

  .password-card {
    margin-top: 20px;
  }

  .avatar-uploader {
    :deep(.el-upload) {
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: border-color 0.3s;

      &:hover {
        border-color: #667eea;
      }
    }
  }

  .avatar-uploader-icon {
    font-size: 28px;
    color: #8c939d;
    width: 100px;
    height: 100px;
    text-align: center;
    line-height: 100px;
  }

  .avatar {
    width: 100px;
    height: 100px;
    display: block;
    object-fit: cover;
  }
}

@media (max-width: 768px) {
  .profile-page {
    .profile-card {
      margin-bottom: 20px;
    }
  }
}
</style>
