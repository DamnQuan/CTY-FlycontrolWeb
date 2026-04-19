const { getPool, dbAsync } = require('../config/database')
const bcrypt = require('bcryptjs')

class User {
  static async findAll({ page = 1, pageSize = 10, keyword = '', isActive = '' } = {}) {
    let whereClause = 'WHERE 1=1'
    const params = []

    if (keyword) {
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR realName LIKE ?)'
      const likeKeyword = `%${keyword}%`
      params.push(likeKeyword, likeKeyword, likeKeyword)
    }

    if (isActive !== '') {
      whereClause += ' AND isActive = ?'
      params.push(isActive === 'true' || isActive === '1' ? 1 : 0)
    }

    const countSql = `SELECT COUNT(*) as total FROM users ${whereClause}`
    const countResult = await dbAsync.queryOne(countSql, params)
    const total = countResult.total

    const offset = (page - 1) * pageSize
    const sql = `
      SELECT id, username, email, realName, cid, rating, avatar, isActive, lastLoginAt, createdAt
      FROM users
      ${whereClause}
      ORDER BY createdAt DESC
      LIMIT ? OFFSET ?
    `

    const users = await dbAsync.query(sql, [...params, pageSize, offset])

    // 为每个用户获取权限
    for (const user of users) {
      user.permissions = await this.getUserPermissions(user.id)
    }

    return {
      data: users,
      pagination: { total, page, pageSize }
    }
  }

  static async findById(id) {
    const sql = `
      SELECT id, username, email, realName, cid, rating, avatar, isActive, lastLoginAt, createdAt
      FROM users
      WHERE id = ?
    `
    const user = await dbAsync.queryOne(sql, [id])
    if (user) {
      user.permissions = await this.getUserPermissions(id)
    }
    return user
  }

  static async findByIdWithPassword(id) {
    const sql = 'SELECT * FROM users WHERE id = ?'
    return await dbAsync.queryOne(sql, [id])
  }

  static async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ?'
    const user = await dbAsync.queryOne(sql, [username])
    if (user) {
      user.permissions = await this.getUserPermissions(user.id)
    }
    return user
  }

  static async findByEmail(email) {
    const sql = 'SELECT * FROM users WHERE email = ?'
    const user = await dbAsync.queryOne(sql, [email])
    if (user) {
      user.permissions = await this.getUserPermissions(user.id)
    }
    return user
  }

  static async create(userData) {
    const { username, email, password, realName, cid, rating, avatar } = userData

    // 检查用户名和邮箱是否已存在
    const existingUser = await this.findByUsername(username)
    if (existingUser) {
      throw new Error('用户名已存在')
    }

    const existingEmail = await this.findByEmail(email)
    if (existingEmail) {
      throw new Error('邮箱已被注册')
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    const sql = `
      INSERT INTO users (username, email, password, realName, cid, rating, avatar)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    const result = await dbAsync.insert(sql, [
      username, email, hashedPassword, realName ?? null, cid ?? null, rating ?? null, avatar ?? null
    ])

    return this.findById(result.id)
  }

  static async update(id, updateData) {
    const allowedFields = ['username', 'email', 'password', 'realName', 'cid', 'rating', 'avatar', 'isActive', 'lastLoginAt']
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

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`
    await dbAsync.update(sql, values)

    return this.findById(id)
  }

  static async delete(id) {
    const sql = 'DELETE FROM users WHERE id = ?'
    const result = await dbAsync.delete(sql, [id])
    return result.affectedRows > 0
  }

  static async getStats() {
    const totalResult = await dbAsync.queryOne('SELECT COUNT(*) as count FROM users')
    const activeResult = await dbAsync.queryOne('SELECT COUNT(*) as count FROM users WHERE isActive = 1')
    const today = new Date().toISOString().split('T')[0]
    const todayResult = await dbAsync.queryOne(
      'SELECT COUNT(*) as count FROM users WHERE DATE(createdAt) = ?',
      [today]
    )

    return {
      total: totalResult.count,
      active: activeResult.count,
      today: todayResult.count
    }
  }

  // 获取用户权限
  static async getUserPermissions(userId) {
    const sql = 'SELECT permission FROM user_permissions WHERE userId = ?'
    const rows = await dbAsync.query(sql, [userId])
    return rows.map(row => row.permission)
  }

  // 添加用户权限
  static async addPermission(userId, permission, grantedBy) {
    try {
      const sql = 'INSERT INTO user_permissions (userId, permission, grantedBy) VALUES (?, ?, ?)'
      await dbAsync.insert(sql, [userId, permission, grantedBy ?? null])
      return true
    } catch (error) {
      // 如果权限已存在，忽略错误
      if (error.code === 'ER_DUP_ENTRY') {
        return true
      }
      throw error
    }
  }

  // 移除用户权限
  static async removePermission(userId, permission) {
    const sql = 'DELETE FROM user_permissions WHERE userId = ? AND permission = ?'
    const result = await dbAsync.delete(sql, [userId, permission])
    return result.affectedRows > 0
  }

  // 清除用户所有权限
  static async clearPermissions(userId) {
    const sql = 'DELETE FROM user_permissions WHERE userId = ?'
    await dbAsync.delete(sql, [userId])
    return true
  }

  // 设置用户权限（全量替换）
  static async setPermissions(userId, permissions, grantedBy) {
    // 先删除所有现有权限
    await dbAsync.delete('DELETE FROM user_permissions WHERE userId = ?', [userId])
    
    // 添加新权限
    for (const permission of permissions) {
      await this.addPermission(userId, permission, grantedBy)
    }
    
    return true
  }

  // 检查用户是否有指定权限
  static async hasPermission(userId, permission) {
    const permissions = await this.getUserPermissions(userId)
    return permissions.includes(permission)
  }

  static async verifyPassword(password, hashedPassword) {
    return bcrypt.compare(password, hashedPassword)
  }

  static async hashPassword(password) {
    return bcrypt.hash(password, 10)
  }
}

module.exports = User
