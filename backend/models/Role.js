const { dbAsync } = require('../config/database')

class Role {
  static async findAll() {
    const sql = 'SELECT * FROM roles ORDER BY createdAt ASC'
    return await dbAsync.query(sql)
  }

  static async findById(id) {
    const sql = 'SELECT * FROM roles WHERE id = ?'
    return await dbAsync.queryOne(sql, [id])
  }

  static async findByName(name) {
    const sql = 'SELECT * FROM roles WHERE name = ?'
    return await dbAsync.queryOne(sql, [name])
  }

  static async create(roleData) {
    const { name, description, permissions, isDefault = false } = roleData

    // 检查角色名是否已存在
    const existing = await this.findByName(name)
    if (existing) {
      throw new Error('角色名称已存在')
    }

    // 如果设置为默认角色，取消其他默认角色
    if (isDefault) {
      await dbAsync.update('UPDATE roles SET isDefault = 0 WHERE isDefault = 1')
    }

    const sql = `
      INSERT INTO roles (name, description, permissions, isDefault)
      VALUES (?, ?, ?, ?)
    `
    const result = await dbAsync.insert(sql, [
      name ?? null, description ?? null,
      typeof permissions === 'object' ? JSON.stringify(permissions) : (permissions ?? null),
      isDefault ? 1 : 0
    ])

    return this.findById(result.id)
  }

  static async update(id, updateData) {
    const allowedFields = ['name', 'description', 'permissions', 'isDefault']
    const updates = []
    const values = []

    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key)) {
        if (key === 'permissions' && typeof value === 'object') {
          updates.push(`${key} = ?`)
          values.push(JSON.stringify(value))
        } else {
          updates.push(`${key} = ?`)
          values.push(value ?? null)
        }
      }
    }

    if (updates.length === 0) {
      return this.findById(id)
    }

    // 如果设置为默认角色，取消其他默认角色
    if (updateData.isDefault) {
      await dbAsync.update('UPDATE roles SET isDefault = 0 WHERE isDefault = 1')
    }

    values.push(id)

    const sql = `UPDATE roles SET ${updates.join(', ')} WHERE id = ?`
    await dbAsync.update(sql, values)

    return this.findById(id)
  }

  static async delete(id) {
    const sql = 'DELETE FROM roles WHERE id = ?'
    const result = await dbAsync.delete(sql, [id])
    return result.affectedRows > 0
  }

  static async getDefaultRole() {
    const sql = 'SELECT * FROM roles WHERE isDefault = 1 LIMIT 1'
    return await dbAsync.queryOne(sql)
  }
}

module.exports = Role
