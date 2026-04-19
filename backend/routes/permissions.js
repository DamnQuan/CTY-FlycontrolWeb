const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { auth, requirePermission } = require('../middleware/auth');
const { ALL_PERMISSIONS, PERMISSION_GROUPS } = require('../config/permissions');
const AuditLog = require('../models/AuditLog');

// 获取所有权限列表（需要 permission:view 权限）
router.get('/list', auth, requirePermission('permission:view'), async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        permissions: ALL_PERMISSIONS,
        groups: PERMISSION_GROUPS
      }
    });
  } catch (err) {
    console.error('获取权限列表错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取用户的权限（需要 permission:view 权限）
router.get('/user/:userId', auth, requirePermission('permission:view'), async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      success: true,
      data: {
        userId: user.id,
        username: user.username,
        permissions: user.permissions
      }
    });
  } catch (err) {
    console.error('获取用户权限错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 给用户添加权限（需要 permission:grant 权限）
router.post('/user/:userId/grant', auth, requirePermission('permission:grant'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { permission } = req.body;

    if (!permission) {
      return res.status(400).json({ message: '请指定权限' });
    }

    if (!ALL_PERMISSIONS.includes(permission)) {
      return res.status(400).json({ message: '无效的权限' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 添加权限
    await User.addPermission(userId, permission, req.user.id);

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'grant_permission',
      resource: 'permission',
      resourceId: userId,
      description: `给用户 ${user.username} 授予权限: ${permission}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 获取更新后的权限
    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      data: {
        userId: updatedUser.id,
        username: updatedUser.username,
        permissions: updatedUser.permissions
      },
      message: '权限授予成功'
    });
  } catch (err) {
    console.error('授予权限错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 移除用户权限（需要 permission:grant 权限）
router.post('/user/:userId/revoke', auth, requirePermission('permission:grant'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { permission } = req.body;

    if (!permission) {
      return res.status(400).json({ message: '请指定权限' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 移除权限
    await User.removePermission(userId, permission);

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'revoke_permission',
      resource: 'permission',
      resourceId: userId,
      description: `移除用户 ${user.username} 的权限: ${permission}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 获取更新后的权限
    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      data: {
        userId: updatedUser.id,
        username: updatedUser.username,
        permissions: updatedUser.permissions
      },
      message: '权限移除成功'
    });
  } catch (err) {
    console.error('移除权限错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 批量设置用户权限（需要 permission:grant 权限）
router.put('/user/:userId', auth, requirePermission('permission:grant'), async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: '权限必须是数组' });
    }

    // 验证权限有效性
    for (const permission of permissions) {
      if (!ALL_PERMISSIONS.includes(permission)) {
        return res.status(400).json({ message: `无效的权限: ${permission}` });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 设置权限（全量替换）
    await User.setPermissions(userId, permissions, req.user.id);

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'set_permissions',
      resource: 'permission',
      resourceId: userId,
      description: `设置用户 ${user.username} 的权限`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    // 获取更新后的权限
    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      data: {
        userId: updatedUser.id,
        username: updatedUser.username,
        permissions: updatedUser.permissions
      },
      message: '权限设置成功'
    });
  } catch (err) {
    console.error('设置权限错误:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
