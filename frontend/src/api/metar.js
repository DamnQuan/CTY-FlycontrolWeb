import request from '@/utils/request'

export const getMetar = (icao) => request.get(`/metar/${icao}`)
export const getBatchMetar = (data) => request.post('/metar/batch', data)
export const getPopularAirports = () => request.get('/metar/airports/popular')
