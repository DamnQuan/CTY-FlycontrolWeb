const { dbAsync } = require('../config/database')

class AuditLog {
  static async create(logData) {
    const { userId, action, resource, resourceType, resourceId, description, details, ip, ipAddress, userAgent } = logData

    // 构建 details JSON 对象
    let detailsValue = null
    if (description) {
      detailsValue = JSON.stringify({ description })
    } else if (details) {
      detailsValue = typeof details === 'object' ? JSON.stringify(details) : JSON.stringify({ info: details })
    }

    const sql = `
      INSERT INTO audit_logs (userId, action, resourceType, resourceId, details, ipAddress, userAgent)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    const result = await dbAsync.insert(sql, [
      userId ?? null, 
      action ?? null, 
      resourceType ?? resource ?? null, 
      resourceId ?? null,
      detailsValue,
      ipAddress ?? ip ?? null, 
      userAgent ?? null
    ])

    return this.findById(result.id)
  }

  static async findById(id) {
    const sql = `
      SELECT al.*, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.userId = u.id
      WHERE al.id = ?
    `
    return await dbAsync.queryOne(sql, [id])
  }

  static async findAll({ page = 1, pageSize = 10, userId = '', action = '', resourceType = '', startDate = '', endDate = '' } = {}) {
    let whereClause = 'WHERE 1=1'
    const params = []

    if (userId) {
      whereClause += ' AND al.userId = ?'
      params.push(userId)
    }

    if (action) {
      whereClause += ' AND al.action = ?'
      params.push(action)
    }

    if (resourceType) {
      whereClause += ' AND al.resourceType = ?'
      params.push(resourceType)
    }

    if (startDate) {
      whereClause += ' AND DATE(al.createdAt) >= ?'
      params.push(startDate)
    }

    if (endDate) {
      whereClause += ' AND DATE(al.createdAt) <= ?'
      params.push(endDate)
    }

    const countSql = `SELECT COUNT(*) as total FROM audit_logs al ${whereClause}`
    const countResult = await dbAsync.queryOne(countSql, params)
    const total = countResult.total

    const offset = (page - 1) * pageSize
    const sql = `
      SELECT al.*, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.userId = u.id
      ${whereClause}
      ORDER BY al.createdAt DESC
      LIMIT ? OFFSET ?
    `

    const logs = await dbAsync.query(sql, [...params, pageSize, offset])

    return {
      data: logs,
      pagination: { total, page, pageSize }
    }
  }

  static async getUserActivity(userId, limit = 10) {
    const sql = `
      SELECT al.*, u.username
      FROM audit_logs al
      LEFT JOIN users u ON al.userId = u.id
      WHERE al.userId = ?
      ORDER BY al.createdAt DESC
      LIMIT ?
    `
    return await dbAsync.query(sql, [userId, limit])
  }

  static async getStats() {
    const today = new Date().toISOString().split('T')[0]

    const totalResult = await dbAsync.queryOne('SELECT COUNT(*) as count FROM audit_logs')
    const todayResult = await dbAsync.queryOne('SELECT COUNT(*) as count FROM audit_logs WHERE DATE(createdAt) = ?', [today])

    return {
      total: totalResult.count,
      today: todayResult.count
    }
  }

  static async cleanup(days = 90) {
    const sql = `DELETE FROM audit_logs WHERE createdAt < DATE_SUB(NOW(), INTERVAL ${days} DAY)`
    const result = await dbAsync.delete(sql)
    return result.affectedRows
  }
}

module.exports = AuditLog
