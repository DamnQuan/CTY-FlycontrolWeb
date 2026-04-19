const AuditLog = require('../models/AuditLog');

// 审计日志中间件
const auditLogger = (action, module, descriptionBuilder) => {
  return async (req, res, next) => {
    // 保存原始json方法
    const originalJson = res.json.bind(res);
    
    // 重写json方法以捕获响应
    res.json = function(data) {
      // 恢复原始方法
      res.json = originalJson;
      
      // 异步记录日志，不阻塞响应
      if (req.user) {
        const description = typeof descriptionBuilder === 'function' 
          ? descriptionBuilder(req, data)
          : descriptionBuilder;

        const logData = {
          user: req.user._id,
          username: req.user.username,
          action: action,
          module: module,
          description: description,
          details: {
            body: req.body,
            params: req.params,
            query: req.query,
            response: data
          },
          ip: req.ip || req.connection.remoteAddress,
          userAgent: req.headers['user-agent'] || '',
          result: data.success !== false ? 'success' : 'failure',
          errorMessage: data.message || ''
        };

        AuditLog.create(logData).catch(err => {
          console.error('审计日志记录失败:', err);
        });
      }
      
      return originalJson(data);
    };
    
    next();
  };
};

// 手动记录审计日志
const logAudit = async (data) => {
  try {
    await AuditLog.create(data);
  } catch (err) {
    console.error('审计日志记录失败:', err);
  }
};

module.exports = {
  auditLogger,
  logAudit
};
