const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Activity = require('../models/Activity');
const Ticket = require('../models/Ticket');
const ControllerApplication = require('../models/ControllerApplication');
const { auth } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// 获取个人资料
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    delete user.password;

    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error('获取个人资料错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 更新个人资料
router.put('/', auth, async (req, res) => {
  try {
    const { realName, cid, rating, avatar } = req.body;

    const user = await User.update(req.user.id, { realName, cid, rating, avatar });
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'profile',
      description: '更新个人资料',
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
    console.error('更新个人资料错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 修改密码
router.put('/password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 获取包含密码的完整用户信息
    const user = await User.findByIdWithPassword(req.user.id);
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 调试日志
    console.log('修改密码 - 用户ID:', req.user.id);
    console.log('修改密码 - 用户对象:', { id: user.id, username: user.username, hasPassword: !!user.password });
    console.log('修改密码 - 当前密码长度:', currentPassword?.length);

    // 验证旧密码
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    console.log('修改密码 - 验证结果:', isMatch);
    
    if (!isMatch) {
      return res.status(400).json({ message: '原密码错误' });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.update(req.user.id, { password: hashedPassword });

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'profile',
      description: '修改密码',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (err) {
    console.error('修改密码错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 上传头像
router.post('/avatar', auth, async (req, res) => {
  try {
    // 处理文件上传
    if (!req.files || !req.files.avatar) {
      return res.status(400).json({ message: '请选择要上传的头像' });
    }

    const avatar = req.files.avatar;
    
    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(avatar.mimetype)) {
      return res.status(400).json({ message: '只支持 JPG、PNG、GIF 格式的图片' });
    }

    // 验证文件大小 (2MB)
    if (avatar.size > 2 * 1024 * 1024) {
      return res.status(400).json({ message: '图片大小不能超过 2MB' });
    }

    // 生成文件名
    const ext = avatar.name.split('.').pop();
    const filename = `avatar_${req.user.id}_${Date.now()}.${ext}`;
    const uploadPath = `./uploads/avatars/${filename}`;

    // 确保目录存在
    const fs = require('fs');
    const path = require('path');
    const dir = path.dirname(uploadPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 移动文件
    await avatar.mv(uploadPath);

    // 更新用户头像
    const avatarUrl = `/uploads/avatars/${filename}`;
    await User.update(req.user.id, { avatar: avatarUrl });

    res.json({
      success: true,
      data: { url: avatarUrl },
      message: '头像上传成功'
    });
  } catch (err) {
    console.error('上传头像错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取我的活动
router.get('/activities', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    
    const result = await Activity.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });

    // 过滤出我参与的活动
    const myActivities = result.data.filter(activity => {
      return activity.participants && activity.participants.some(p => p.userId === req.user.id);
    });

    res.json({
      success: true,
      data: myActivities,
      pagination: {
        total: myActivities.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取我的活动错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取我的工单
router.get('/tickets', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    
    const result = await Ticket.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      userId: req.user.id
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('获取我的工单错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取我的工单统计
router.get('/tickets/stats', auth, async (req, res) => {
  try {
    const result = await Ticket.findAll({
      page: 1,
      pageSize: 1000,
      userId: req.user.id
    });

    const tickets = result.data || [];
    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in_progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    console.error('获取工单统计错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 更新头像
router.put('/avatar', auth, async (req, res) => {
  try {
    const { avatar } = req.body;

    if (!avatar) {
      return res.status(400).json({ message: '请提供头像URL' });
    }

    const user = await User.update(req.user.id, { avatar });
    if (!user) {
      return res.status(404).json({ message: '用户不存在' });
    }

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'profile',
      description: '更新头像',
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    delete user.password;

    res.json({
      success: true,
      data: user,
      message: '头像更新成功'
    });
  } catch (err) {
    console.error('更新头像错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取我的申请
router.get('/applications', auth, async (req, res) => {
  try {
    const applications = await ControllerApplication.findByApplicantId(req.user.id);

    res.json({
      success: true,
      data: applications
    });
  } catch (err) {
    console.error('获取我的申请错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取通知列表（模拟数据）
router.get('/notifications', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;

    // 返回模拟通知数据，实际项目中应该从数据库获取
    const notifications = [
      {
        id: 1,
        title: '欢迎使用系统',
        content: '感谢您注册使用CTY垂天云飞控系统',
        type: 'system',
        isRead: false,
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: notifications,
      pagination: {
        total: notifications.length,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    console.error('获取通知错误:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
