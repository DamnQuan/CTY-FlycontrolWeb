import request from '@/utils/request'

export const getAuditLogs = (params) => {
  return request.get('/audit-logs', { params })
}
