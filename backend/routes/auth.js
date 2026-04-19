const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// 注册
router.post('/register', [
  body('username').trim().isLength({ min: 3, max: 20 }).withMessage('用户名长度必须在3-20个字符之间'),
  body('cid').trim().notEmpty().withMessage('CID不能为空'),
  body('email').isEmail().withMessage('请输入有效的邮箱地址'),
  body('password').isLength({ min: 6 }).withMessage('密码长度至少为6个字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: '参数验证失败', errors: errors.array() });
    }

    const { username, cid, email, password } = req.body;

    // 检查用户名是否已存在
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({ message: '用户名已存在' });
    }

    // 检查邮箱是否已存在
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({ message: '邮箱已被注册' });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await User.create({
      username,
      cid,
      email,
      password: hashedPassword
    });

    // 生成JWT - 不再包含role
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          permissions: user.permissions,
          avatar: user.avatar
        }
      },
      message: '注册成功'
    });
  } catch (err) {
    console.error('注册错误:', err);
    res.status(500).json({ message: err.message || '注册失败' });
  }
});

// 登录
router.post('/login', [
  body('username').trim().notEmpty().withMessage('请输入用户名'),
  body('password').notEmpty().withMessage('请输入密码')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: '参数验证失败', errors: errors.array() });
    }

    const { username, password } = req.body;

    // 查找用户
    let user = await User.findByUsername(username);
    if (!user) {
      user = await User.findByEmail(username);
    }

    if (!user) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: '用户名或密码错误' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: '账号已被禁用' });
    }

    // 更新登录信息
    await User.update(user.id, {
      lastLoginAt: new Date().toISOString()
    });

    // 记录审计日志
    await AuditLog.create({
      userId: user.id,
      action: 'login',
      resource: 'auth',
      description: '用户登录',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    });

    // 生成JWT - 不再包含role
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          permissions: user.permissions,
          avatar: user.avatar
        }
      },
      message: '登录成功'
    });
  } catch (err) {
    console.error('登录错误:', err);
    res.status(500).json({ message: err.message || '登录失败' });
  }
});

// 获取当前用户信息
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        permissions: user.permissions,
        realName: user.realName,
        cid: user.cid,
        rating: user.rating,
        avatar: user.avatar,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('获取用户信息错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 退出登录
router.post('/logout', auth, async (req, res) => {
  try {
    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'logout',
      resource: 'auth',
      description: '用户退出登录',
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'] || ''
    });

    res.json({
      success: true,
      message: '退出成功'
    });
  } catch (err) {
    console.error('退出登录错误:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
