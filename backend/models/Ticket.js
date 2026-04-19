const { dbAsync } = require('../config/database')

class Ticket {
  static async findAll({ page = 1, pageSize = 10, keyword = '', type = '', status = '', priority = '', userId = '' } = {}) {
    let whereClause = 'WHERE 1=1'
    const params = []

    if (keyword) {
      whereClause += ' AND (t.title LIKE ? OR t.ticketNo LIKE ?)'
      const likeKeyword = `%${keyword}%`
      params.push(likeKeyword, likeKeyword)
    }

    if (type) {
      whereClause += ' AND t.type = ?'
      params.push(type)
    }

    if (status) {
      whereClause += ' AND t.status = ?'
      params.push(status)
    }

    if (priority) {
      whereClause += ' AND t.priority = ?'
      params.push(priority)
    }

    if (userId) {
      whereClause += ' AND (t.creatorId = ? OR t.assigneeId = ?)'
      params.push(userId, userId)
    }

    const countSql = `SELECT COUNT(*) as total FROM tickets t ${whereClause}`
    const countResult = await dbAsync.queryOne(countSql, params)
    const total = countResult.total

    const offset = (page - 1) * pageSize
    const sql = `
      SELECT t.id, t.ticketNo, t.title, t.description, t.type, t.priority, t.status,
             t.creatorId, t.assigneeId, t.handlerId, t.handledAt, t.createdAt, t.updatedAt, t.closedAt,
             creator.username as creatorName,
             assignee.username as assigneeName
      FROM tickets t
      LEFT JOIN users creator ON t.creatorId = creator.id
      LEFT JOIN users assignee ON t.assigneeId = assignee.id
      ${whereClause}
      ORDER BY t.createdAt DESC
      LIMIT ? OFFSET ?
    `

    const tickets = await dbAsync.query(sql, [...params, pageSize, offset])

    return {
      data: tickets,
      pagination: { total, page, pageSize }
    }
  }

  static async findById(id) {
    const sql = `
      SELECT t.id, t.ticketNo, t.title, t.description, t.type, t.priority, t.status,
             t.creatorId, t.assigneeId, t.handlerId, t.handledAt, t.createdAt, t.updatedAt, t.closedAt,
             creator.username as creatorName,
             assignee.username as assigneeName,
             handler.username as handlerName
      FROM tickets t
      LEFT JOIN users creator ON t.creatorId = creator.id
      LEFT JOIN users assignee ON t.assigneeId = assignee.id
      LEFT JOIN users handler ON t.handlerId = handler.id
      WHERE t.id = ?
    `
    return await dbAsync.queryOne(sql, [id])
  }

  static async create(ticketData) {
    const { title, description, type, priority, creatorId } = ticketData
    const ticketNo = 'TK' + Date.now().toString(36).toUpperCase()

    const sql = `
      INSERT INTO tickets (ticketNo, title, description, type, priority, creatorId)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    const result = await dbAsync.insert(sql, [
      ticketNo, title ?? null, description ?? null, type ?? null, priority ?? null, creatorId ?? null
    ])

    return this.findById(result.id)
  }

  static async update(id, updateData) {
    const allowedFields = ['title', 'description', 'type', 'priority', 'status', 'assigneeId', 'handlerId', 'handledAt', 'closedAt']
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

    const sql = `UPDATE tickets SET ${updates.join(', ')} WHERE id = ?`
    await dbAsync.update(sql, values)

    return this.findById(id)
  }

  // 处理工单 - 记录处理人并更新状态
  static async handleTicket(id, handlerId) {
    const sql = `
      UPDATE tickets 
      SET status = 'processing', handlerId = ?, handledAt = NOW() 
      WHERE id = ?
    `
    await dbAsync.update(sql, [handlerId, id])
    return this.findById(id)
  }

  static async delete(id) {
    const sql = 'DELETE FROM tickets WHERE id = ?'
    const result = await dbAsync.delete(sql, [id])
    return result.affectedRows > 0
  }

  static async addComment(ticketId, userId, content, isInternal = false) {
    const sql = `
      INSERT INTO ticket_comments (ticketId, userId, content, isInternal)
      VALUES (?, ?, ?, ?)
    `
    const result = await dbAsync.insert(sql, [ticketId, userId, content, isInternal ? 1 : 0])
    return this.getCommentById(result.id)
  }

  static async getCommentById(id) {
    const sql = `
      SELECT tc.*, u.username, u.realName, u.avatar
      FROM ticket_comments tc
      JOIN users u ON tc.userId = u.id
      WHERE tc.id = ?
    `
    return await dbAsync.queryOne(sql, [id])
  }

  static async getComments(ticketId, includeInternal = false) {
    let sql = `
      SELECT tc.*, u.username, u.realName, u.avatar
      FROM ticket_comments tc
      JOIN users u ON tc.userId = u.id
      WHERE tc.ticketId = ?
    `
    if (!includeInternal) {
      sql += ' AND tc.isInternal = 0'
    }
    sql += ' ORDER BY tc.createdAt ASC'

    return await dbAsync.query(sql, [ticketId])
  }

  static async getStats() {
    const totalResult = await dbAsync.queryOne('SELECT COUNT(*) as count FROM tickets')
    const openResult = await dbAsync.queryOne("SELECT COUNT(*) as count FROM tickets WHERE status = 'open'")
    const processingResult = await dbAsync.queryOne("SELECT COUNT(*) as count FROM tickets WHERE status = 'processing'")
    const resolvedResult = await dbAsync.queryOne("SELECT COUNT(*) as count FROM tickets WHERE status = 'resolved'")

    return {
      total: totalResult.count,
      open: openResult.count,
      processing: processingResult.count,
      resolved: resolvedResult.count
    }
  }

  static async getRecentTickets(limit = 5) {
    const sql = `
      SELECT t.*, u.username as creatorName
      FROM tickets t
      LEFT JOIN users u ON t.creatorId = u.id
      ORDER BY t.createdAt DESC
      LIMIT ?
    `
    return await dbAsync.query(sql, [limit])
  }
}

module.exports = Ticket
