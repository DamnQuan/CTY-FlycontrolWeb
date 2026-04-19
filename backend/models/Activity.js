const { dbAsync } = require('../config/database')

class Activity {
  static async findAll({ page = 1, pageSize = 10, keyword = '', type = '', status = '' } = {}) {
    let whereClause = 'WHERE 1=1'
    const params = []

    if (keyword) {
      whereClause += ' AND (a.title LIKE ? OR a.description LIKE ?)'
      const likeKeyword = `%${keyword}%`
      params.push(likeKeyword, likeKeyword)
    }

    if (type) {
      whereClause += ' AND a.type = ?'
      params.push(type)
    }

    if (status) {
      whereClause += ' AND a.status = ?'
      params.push(status)
    }

    const countSql = `SELECT COUNT(*) as total FROM activities a ${whereClause}`
    const countResult = await dbAsync.queryOne(countSql, params)
    const total = countResult.total

    const offset = (page - 1) * pageSize
    const sql = `
      SELECT a.*, u.username as organizerName, u.realName as organizerRealName
      FROM activities a
      LEFT JOIN users u ON a.organizerId = u.id
      ${whereClause}
      ORDER BY a.createdAt DESC
      LIMIT ? OFFSET ?
    `

    const activities = await dbAsync.query(sql, [...params, pageSize, offset])

    return {
      data: activities,
      pagination: { total, page, pageSize }
    }
  }

  static async findById(id) {
    const sql = `
      SELECT a.*, u.username as organizerName, u.realName as organizerRealName
      FROM activities a
      LEFT JOIN users u ON a.organizerId = u.id
      WHERE a.id = ?
    `
    return await dbAsync.queryOne(sql, [id])
  }

  static async create(activityData) {
    const { title, type, description, startTime, endTime, location, maxParticipants, status, organizerId,
            coverImage, departureAirport, arrivalAirport, route, distance, notams } = activityData

    const sql = `
      INSERT INTO activities (title, type, description, startTime, endTime, location, maxParticipants, status, organizerId,
                              coverImage, departureAirport, arrivalAirport, route, distance, notams)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    const result = await dbAsync.insert(sql, [
      title ?? null, type ?? null, description ?? null, startTime ?? null, endTime ?? null, location ?? null,
      maxParticipants ?? null, status ?? null, organizerId ?? null,
      coverImage ?? null, departureAirport ?? null, arrivalAirport ?? null, route ?? null, distance ?? null, notams ?? null
    ])

    return this.findById(result.id)
  }

  static async update(id, updateData) {
    const allowedFields = ['title', 'type', 'description', 'startTime', 'endTime', 'location', 'maxParticipants', 'status', 'organizerId',
                           'coverImage', 'departureAirport', 'arrivalAirport', 'route', 'distance', 'notams']
    const updates = []
    const values = []

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        updates.push(`${key} = ?`)
        values.push(value ?? null)
      }
    }

    if (updates.length === 0) {
      return this.findById(id)
    }

    values.push(id)

    const sql = `UPDATE activities SET ${updates.join(', ')} WHERE id = ?`
    await dbAsync.update(sql, values)

    return this.findById(id)
  }

  static async delete(id) {
    const sql = 'DELETE FROM activities WHERE id = ?'
    const result = await dbAsync.delete(sql, [id])
    return result.affectedRows > 0
  }

  static async register(activityId, userId) {
    const sql = `
      INSERT INTO activity_participants (activityId, userId)
      VALUES (?, ?)
    `
    try {
      await dbAsync.insert(sql, [activityId, userId])
      return true
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        throw new Error('您已经报名过此活动')
      }
      throw err
    }
  }

  static async unregister(activityId, userId) {
    const sql = 'DELETE FROM activity_participants WHERE activityId = ? AND userId = ?'
    const result = await dbAsync.delete(sql, [activityId, userId])
    return result.affectedRows > 0
  }

  static async getParticipants(activityId) {
    const sql = `
      SELECT ap.*, u.username, u.realName, u.avatar
      FROM activity_participants ap
      JOIN users u ON ap.userId = u.id
      WHERE ap.activityId = ?
      ORDER BY ap.registeredAt DESC
    `
    return await dbAsync.query(sql, [activityId])
  }

  static async isRegistered(activityId, userId) {
    const sql = 'SELECT COUNT(*) as count FROM activity_participants WHERE activityId = ? AND userId = ?'
    const result = await dbAsync.queryOne(sql, [activityId, userId])
    return result.count > 0
  }

  static async getStats() {
    const totalResult = await dbAsync.queryOne('SELECT COUNT(*) as count FROM activities')
    const ongoingResult = await dbAsync.queryOne("SELECT COUNT(*) as count FROM activities WHERE status = 'ongoing'")
    const upcomingResult = await dbAsync.queryOne("SELECT COUNT(*) as count FROM activities WHERE status = 'published' AND startTime > NOW()")

    return {
      total: totalResult.count,
      ongoing: ongoingResult.count,
      upcoming: upcomingResult.count
    }
  }

  static async getRecentActivities(limit = 5) {
    const sql = `
      SELECT a.*, u.username as organizerName
      FROM activities a
      LEFT JOIN users u ON a.organizerId = u.id
      WHERE a.status IN ('published', 'ongoing')
      ORDER BY a.startTime ASC
      LIMIT ?
    `
    return await dbAsync.query(sql, [limit])
  }
}

module.exports = Activity
