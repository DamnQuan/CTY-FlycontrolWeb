const mysql = require('mysql2/promise')

let pool = null

const initDatabase = async () => {
  if (pool) return pool

  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'cty_flight_control',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 0
    })

    console.log('MySQL连接池创建成功')

    // 初始化表结构
    await createTables()

    return pool
  } catch (error) {
    console.error('MySQL连接失败:', error)
    throw error
  }
}

const createTables = async () => {
  const connection = await pool.getConnection()

  try {
    // 用户表 - 去掉role字段
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        realName VARCHAR(50),
        cid VARCHAR(20),
        rating VARCHAR(20),
        avatar VARCHAR(255),
        isActive TINYINT DEFAULT 1,
        lastLoginAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_isActive (isActive)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 用户权限表 - 每个用户可以有多个权限
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        permission VARCHAR(100) NOT NULL,
        grantedBy INT,
        grantedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (grantedBy) REFERENCES users(id) ON DELETE SET NULL,
        UNIQUE KEY unique_user_permission (userId, permission),
        INDEX idx_permission (permission)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 活动表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        type ENUM('training', 'exam', 'event', 'meeting', 'other'),
        description TEXT,
        startTime VARCHAR(50),
        endTime VARCHAR(50),
        location VARCHAR(200),
        maxParticipants INT DEFAULT 0,
        status ENUM('draft', 'published', 'ongoing', 'completed', 'cancelled') DEFAULT 'draft',
        organizerId INT,
        coverImage VARCHAR(500),
        departureAirport VARCHAR(10),
        arrivalAirport VARCHAR(10),
        route TEXT,
        distance INT DEFAULT 0,
        notams TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (organizerId) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_status (status),
        INDEX idx_type (type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 活动参与者表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS activity_participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        activityId INT NOT NULL,
        userId INT NOT NULL,
        status ENUM('registered', 'attended', 'absent') DEFAULT 'registered',
        registeredAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (activityId) REFERENCES activities(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_participant (activityId, userId)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 工单表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticketNo VARCHAR(50) UNIQUE NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        type ENUM('bug', 'feature', 'support', 'complaint', 'other'),
        priority ENUM('urgent', 'high', 'medium', 'low') DEFAULT 'medium',
        status ENUM('open', 'processing') DEFAULT 'open',
        creatorId INT,
        assigneeId INT,
        handlerId INT,
        handledAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        closedAt DATETIME,
        FOREIGN KEY (creatorId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (assigneeId) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (handlerId) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_status (status),
        INDEX idx_priority (priority)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 工单评论表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ticket_comments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ticketId INT NOT NULL,
        userId INT NOT NULL,
        content TEXT NOT NULL,
        isInternal TINYINT DEFAULT 0,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticketId) REFERENCES tickets(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 管制员申请表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS controller_applications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        cid VARCHAR(20) NOT NULL,
        email VARCHAR(100),
        rating VARCHAR(20) NOT NULL,
        experience TEXT,
        motivation TEXT,
        status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
        reviewerId INT,
        reviewComment TEXT,
        reviewNotes TEXT,
        reviewedAt DATETIME,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (reviewerId) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    // 审计日志表
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT,
        action VARCHAR(100) NOT NULL,
        resourceType VARCHAR(50),
        resourceId VARCHAR(50),
        details JSON,
        ipAddress VARCHAR(50),
        userAgent TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_action (action),
        INDEX idx_createdAt (createdAt)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `)

    console.log('所有表创建成功')

  } finally {
    connection.release()
  }
}

const getPool = () => {
  if (!pool) {
    throw new Error('数据库未初始化，请先调用 initDatabase()')
  }
  return pool
}

// 辅助函数
const dbAsync = {
  query: async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params)
    return rows
  },
  queryOne: async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params)
    return rows[0] || null
  },
  insert: async (sql, params = []) => {
    const [result] = await pool.execute(sql, params)
    return { id: result.insertId, affectedRows: result.affectedRows }
  },
  update: async (sql, params = []) => {
    const [result] = await pool.execute(sql, params)
    return { affectedRows: result.affectedRows }
  },
  delete: async (sql, params = []) => {
    const [result] = await pool.execute(sql, params)
    return { affectedRows: result.affectedRows }
  }
}

module.exports = {
  initDatabase,
  getPool,
  dbAsync
}
