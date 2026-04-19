const { dbAsync } = require('../config/database')

class ControllerApplication {
  static async findAll({ page = 1, pageSize = 10, status = '', userId = '' } = {}) {
    let whereClause = 'WHERE 1=1'
    const params = []

    if (status) {
      whereClause += ' AND ca.status = ?'
      params.push(status)
    }

    if (userId) {
      whereClause += ' AND ca.userId = ?'
      params.push(userId)
    }

    const countSql = `SELECT COUNT(*) as total FROM controller_applications ca ${whereClause}`
    const countResult = await dbAsync.queryOne(countSql, params)
    const total = countResult.total

    const offset = (page - 1) * pageSize
    const sql = `
      SELECT ca.*,
        u.username, u.email,
        reviewer.username as reviewerName
      FROM controller_applications ca
      JOIN users u ON ca.userId = u.id
      LEFT JOIN users reviewer ON ca.reviewerId = reviewer.id
      ${whereClause}
      ORDER BY ca.createdAt DESC
      LIMIT ? OFFSET ?
    `

    const applications = await dbAsync.query(sql, [...params, pageSize, offset])

    return {
      data: applications,
      pagination: { total, page, pageSize }
    }
  }

  static async findById(id) {
    const sql = `
      SELECT ca.*,
        u.username, u.email,
        reviewer.username as reviewerName
      FROM controller_applications ca
      JOIN users u ON ca.userId = u.id
      LEFT JOIN users reviewer ON ca.reviewerId = reviewer.id
      WHERE ca.id = ?
    `
    return await dbAsync.queryOne(sql, [id])
  }

  static async findByUserId(userId) {
    const sql = `
      SELECT ca.*, u.username, u.email
      FROM controller_applications ca
      JOIN users u ON ca.userId = u.id
      WHERE ca.userId = ?
      ORDER BY ca.createdAt DESC
    `
    return await dbAsync.query(sql, [userId])
  }

  static async create(applicationData) {
    const { userId, cid, email, rating, experience, motivation } = applicationData

    // 检查是否已有待处理的申请
    const existingSql = `
      SELECT COUNT(*) as count FROM controller_applications
      WHERE userId = ? AND status = 'pending'
    `
    const existing = await dbAsync.queryOne(existingSql, [userId])
    if (existing.count > 0) {
      throw new Error('您已有待处理的申请，请勿重复提交')
    }

    const sql = `
      INSERT INTO controller_applications (userId, cid, email, rating, experience, motivation)
      VALUES (?, ?, ?, ?, ?, ?)
    `
    const result = await dbAsync.insert(sql, [
      userId, cid ?? null, email ?? null, rating ?? null, experience ?? null, motivation ?? null
    ])

    return this.findById(result.id)
  }

  static async update(id, updateData) {
    const allowedFields = ['realName', 'cid', 'rating', 'position', 'experience', 'reason', 'status', 'reviewerId', 'reviewComment', 'reviewNotes', 'reviewedAt']
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

    const sql = `UPDATE controller_applications SET ${updates.join(', ')} WHERE id = ?`
    await dbAsync.update(sql, values)

    return this.findById(id)
  }

  static async review(id, { status, reviewerId, reviewComment }) {
    const sql = `
      UPDATE controller_applications
      SET status = ?, reviewerId = ?, reviewComment = ?, reviewedAt = NOW(), updatedAt = NOW()
      WHERE id = ?
    `
    await dbAsync.update(sql, [status, reviewerId, reviewComment, id])

    // 如果审核通过，更新用户角色
    if (status === 'approved') {
      const appSql = 'SELECT userId FROM controller_applications WHERE id = ?'
      const application = await dbAsync.queryOne(appSql, [id])
      if (application) {
        await dbAsync.update("UPDATE users SET role = 'controller' WHERE id = ?", [application.userId])
      }
    }

    return this.findById(id)
  }

  static async delete(id) {
    const sql = 'DELETE FROM controller_applications WHERE id = ?'
    const result = await dbAsync.delete(sql, [id])
    return result.affectedRows > 0
  }

  static async getStats() {
    const totalResult = await dbAsync.queryOne('SELECT COUNT(*) as count FROM controller_applications')
    const pendingResult = await dbAsync.queryOne("SELECT COUNT(*) as count FROM controller_applications WHERE status = 'pending'")
    const approvedResult = await dbAsync.queryOne("SELECT COUNT(*) as count FROM controller_applications WHERE status = 'approved'")
    const rejectedResult = await dbAsync.queryOne("SELECT COUNT(*) as count FROM controller_applications WHERE status = 'rejected'")

    return {
      total: totalResult.count,
      pending: pendingResult.count,
      approved: approvedResult.count,
      rejected: rejectedResult.count
    }
  }

  static async getApprovedCount() {
    const result = await dbAsync.queryOne(
      "SELECT COUNT(*) as count FROM controller_applications WHERE status = 'approved'"
    )
    return result.count
  }
}

module.exports = ControllerApplication
