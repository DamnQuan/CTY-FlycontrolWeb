import request from '@/utils/request'

// 获取首页统计数据
export function getHomeStats() {
  return request({
    url: '/stats/home',
    method: 'get'
  })
}
