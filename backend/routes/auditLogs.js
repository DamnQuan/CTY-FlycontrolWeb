const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { auth, requirePermission } = require('../middleware/auth');

// 获取审计日志列表（需要 audit:view 权限）
router.get('/', auth, requirePermission('audit:view'), async (req, res) => {
  try {
    const { 
      page = 1, 
      pageSize = 20, 
      username, 
      action, 
      resource, 
      startDate, 
      endDate 
    } = req.query;
    
    const result = AuditLog.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      username,
      action,
      resource,
      startDate,
      endDate
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
