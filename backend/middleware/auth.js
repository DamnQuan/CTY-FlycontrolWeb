const jwt = require('jsonwebtoken');
const User = require('../models/User');

// 验证JWT令牌
const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ message: '未提供认证令牌' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: '令牌无效或已过期' });
  }
};

// 权限检查中间件工厂函数
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ message: '未登录' });
      }

      // 获取用户权限
      const permissions = await User.getUserPermissions(req.user.id);
      
      // 检查是否有指定权限
      if (!permissions.includes(permission)) {
        return res.status(403).json({ message: `需要权限: ${permission}` });
      }
      
      next();
    } catch (err) {
      console.error('权限检查错误:', err);
      res.status(500).json({ message: '权限检查失败' });
    }
  };
};

// 可选认证（用于某些公开接口）
const optionalAuth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.user = decoded;
    }
    
    next();
  } catch (err) {
    // 令牌无效时也继续，只是不设置用户信息
    next();
  }
};

module.exports = {
  auth,
  requirePermission,
  optionalAuth
};
