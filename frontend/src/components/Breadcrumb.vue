<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item v-if="isAdmin">管理中心</el-breadcrumb-item>
    <el-breadcrumb-item v-if="currentRoute.meta?.title">
      {{ currentRoute.meta.title }}
    </el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const currentRoute = computed(() => route)
const isAdmin = computed(() => route.path.startsWith('/admin'))
</script>
