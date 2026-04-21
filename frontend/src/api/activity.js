import request from '@/utils/request'

export const getActivityList = (params) => request.get('/activities', { params })
export const getActivityDetail = (id) => request.get(`/activities/${id}`)
export const createActivity = (data) => request.post('/activities', data)
export const updateActivity = (id, data) => request.put(`/activities/${id}`, data)
export const deleteActivity = (id) => request.delete(`/activities/${id}`)
export const registerActivity = (id, data) => request.post(`/activities/${id}/register`, data)
export const cancelActivity = (id) => request.post(`/activities/${id}/cancel`)
