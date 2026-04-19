const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, requirePermission } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// 获取用户列表（需要 user:view 权限）
router.get('/', auth, requirePermission('user:view'), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, isActive } = req.query;
    
    const result = await User.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
      isActive
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('获取用户列表错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取单个用户
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 删除敏感信息
    delete user.password;

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('获取单个用户错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 创建用户（需要 user:create 权限）
router.post('/', auth, requirePermission('user:create'), async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 检查用户名是否已存在
    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 检查邮箱是否已存在
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword
    });

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'create',
      resource: 'user',
      resourceId: user.id,
      description: `创建用户: ${username}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    delete user.password;

    res.json({
      success: true,
      data: user,
      message: '创建成功'
    });
  } catch (err) {
    console.error('创建用户错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 更新用户（需要 user:update 权限）
router.put('/:id', auth, requirePermission('user:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // 如果更新密码，需要加密
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    const user = await User.update(id, updateData);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'user',
      resourceId: id,
      description: `更新用户信息`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    delete user.password;

    res.json({
      success: true,
      data: user,
      message: '更新成功'
    });
  } catch (err) {
    console.error('更新用户错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 删除用户（需要 user:delete 权限）
router.delete('/:id', auth, requirePermission('user:delete'), async (req, res) => {
  try {
    const { id } = req.params;

    // 不能删除自己
    if (req.user.id == id) {
      return res.status(400).json({ message: '不能删除自己的账号' });
    }

    const success = await User.delete(id);
    if (!success) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'delete',
      resource: 'user',
      resourceId: id,
      description: `删除用户`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (err) {
    console.error('删除用户错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 重置密码（需要 user:update 权限）
router.put('/:id/reset-password', auth, requirePermission('user:update'), async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: '新密码长度至少为6个字符' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update(id, { password: hashedPassword });

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'user',
      resourceId: id,
      description: `重置用户密码: ${user.username}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (err) {
    console.error('重置密码错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取用户权限（需要 permission:view 权限）
router.get('/:id/permissions', auth, requirePermission('permission:view'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    const permissions = await User.getUserPermissions(id);

    res.json({
      success: true,
      data: permissions
    });
  } catch (err) {
    console.error('获取用户权限错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 更新用户权限（需要 permission:grant 权限）
router.put('/:id/permissions', auth, requirePermission('permission:grant'), async (req, res) => {
  try {
    const { id } = req.params;
    const { permissions } = req.body;

    if (!Array.isArray(permissions)) {
      return res.status(400).json({ message: '权限参数必须是数组' });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 删除用户现有权限
    await User.clearPermissions(id);

    // 添加新权限
    for (const permission of permissions) {
      await User.addPermission(id, permission, req.user.id);
    }

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'user',
      resourceId: id,
      description: `更新用户权限: ${user.username}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: '权限更新成功'
    });
  } catch (err) {
    console.error('更新用户权限错误:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
