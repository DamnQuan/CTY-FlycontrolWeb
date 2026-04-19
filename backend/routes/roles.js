const express = require('express');
const router = express.Router();
const { ALL_PERMISSIONS, PERMISSION_GROUPS } = require('../config/permissions');
const { auth, requirePermission } = require('../middleware/auth');

// 获取所有权限列表（需要 permission:view 权限）
router.get('/permissions', auth, requirePermission('permission:view'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        permissions: ALL_PERMISSIONS,
        groups: PERMISSION_GROUPS
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// 保留旧接口以兼容，返回空角色列表
router.get('/', auth, async (req, res) => {
  try {
    res.json({
      success: true,
      data: [],
      message: '角色系统已废弃，请使用权限系统'
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
