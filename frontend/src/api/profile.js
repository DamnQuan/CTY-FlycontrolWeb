import request from '@/utils/request'

export const getProfile = () => request.get('/profile')
export const updateProfile = (data) => request.put('/profile', data)
export const updateAvatar = (data) => request.put('/profile/avatar', data)
export const changePassword = (data) => request.put('/profile/password', data)
export const getMyTicketsStats = () => request.get('/profile/tickets/stats')
export const getMyActivities = (params) => request.get('/profile/activities', { params })
export const getMyApplications = () => request.get('/profile/applications')
export const getNotifications = () => request.get('/profile/notifications')
