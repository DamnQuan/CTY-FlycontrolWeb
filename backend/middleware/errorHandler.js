// 全局错误处理中间件
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // 处理JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: '无效的认证令牌'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: '认证令牌已过期'
    });
  }

  // 处理SQLite错误
  if (err.message && err.message.includes('SQLITE_CONSTRAINT_UNIQUE')) {
    return res.status(400).json({
      success: false,
      message: '数据已存在（唯一性约束冲突）'
    });
  }

  if (err.message && err.message.includes('SQLITE_CONSTRAINT_FOREIGNKEY')) {
    return res.status(400).json({
      success: false,
      message: '关联数据不存在（外键约束冲突）'
    });
  }

  // 默认错误响应
  res.status(err.status || 500).json({
    success: false,
    message: err.message || '服务器内部错误',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// 404处理中间件
const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    message: '请求的接口不存在'
  });
};

module.exports = {
  errorHandler,
  notFoundHandler
};
