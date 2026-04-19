import dayjs from 'dayjs'

export const formatDate = (date, format = 'YYYY-MM-DD') => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatDateTime = (date, format = 'YYYY-MM-DD HH:mm') => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const formatTime = (date, format = 'HH:mm') => {
  if (!date) return '-'
  return dayjs(date).format(format)
}

export const fromNow = (date) => {
  if (!date) return '-'
  return dayjs(date).fromNow()
}

export const isBefore = (date1, date2) => {
  return dayjs(date1).isBefore(dayjs(date2))
}

export const isAfter = (date1, date2) => {
  return dayjs(date1).isAfter(dayjs(date2))
}

export const addDays = (date, days) => {
  return dayjs(date).add(days, 'day').toDate()
}

export const startOfDay = (date) => {
  return dayjs(date).startOf('day').toDate()
}

export const endOfDay = (date) => {
  return dayjs(date).endOf('day').toDate()
}
