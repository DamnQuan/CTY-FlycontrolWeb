import request from '@/utils/request'

export const getTickets = (params) => request.get('/tickets', { params })
export const getTicketList = (params) => request.get('/tickets', { params })
export const getTicketDetail = (id) => request.get(`/tickets/${id}`)
export const createTicket = (data) => request.post('/tickets', data)
export const updateTicket = (id, data) => request.put(`/tickets/${id}`, data)
export const deleteTicket = (id) => request.delete(`/tickets/${id}`)
export const assignTicket = (id, data) => request.put(`/tickets/${id}/assign`, data)
export const addComment = (id, data) => request.post(`/tickets/${id}/comments`, data)
export const closeTicket = (id, data) => request.put(`/tickets/${id}/close`, data)

// 工单评论相关
export const getTicketComments = (id) => request.get(`/tickets/${id}/comments`)
export const addTicketComment = (id, data) => request.post(`/tickets/${id}/comments`, data)
