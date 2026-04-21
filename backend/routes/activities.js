const express = require('express');
const router = express.Router();
const Activity = require('../models/Activity');
const { auth, requirePermission } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// 获取活动列表
router.get('/', async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, type, status } = req.query;
    
    const result = await Activity.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
      type,
      status
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('获取活动列表错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取单个活动
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }

    // 获取参与者信息
    const participants = await Activity.getParticipants(req.params.id);
    activity.participants = participants;

    res.json({
      success: true,
      data: activity
    });
  } catch (err) {
    console.error('获取活动详情错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 创建活动（需要 activity:create 权限）
router.post('/', auth, requirePermission('activity:create'), async (req, res) => {
  try {
    const activityData = {
      ...req.body,
      organizerId: req.user.id
    };

    const activity = await Activity.create(activityData);

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'create',
      resource: 'activity',
      resourceId: activity.id,
      description: `创建活动: ${activity.title}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: activity,
      message: '创建成功'
    });
  } catch (err) {
    console.error('创建活动错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 更新活动（需要 activity:update 权限）
router.put('/:id', auth, requirePermission('activity:update'), async (req, res) => {
  try {
    const activity = await Activity.update(req.params.id, req.body);
    if (!activity) {
      return res.status(404).json({ message: '活动不存在' });
    }

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'activity',
      resourceId: activity.id,
      description: `更新活动: ${activity.title}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: activity,
      message: '更新成功'
    });
  } catch (err) {
    console.error('更新活动错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 删除活动（需要 activity:delete 权限）
router.delete('/:id', auth, requirePermission('activity:delete'), async (req, res) => {
  try {
    const success = await Activity.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: '活动不存在' });
    }

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'delete',
      resource: 'activity',
      resourceId: req.params.id,
      description: `删除活动`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: '删除成功'
    });
  } catch (err) {
    console.error('删除活动错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 报名活动
router.post('/:id/register', auth, async (req, res) => {
  try {
    const { registrationType, position, frequency, cid, callsign, aircraft } = req.body;
    
    // 验证必填字段
    if (!registrationType) {
      return res.status(400).json({ message: '请选择报名类型' });
    }
    
    if (registrationType === 'controller') {
      if (!position || !frequency || !cid) {
        return res.status(400).json({ message: '请填写完整的管制员报名信息' });
      }
    } else if (registrationType === 'pilot') {
      if (!callsign || !aircraft || !cid) {
        return res.status(400).json({ message: '请填写完整的机组报名信息' });
      }
    }
    
    await Activity.register(req.params.id, req.user.id, {
      registrationType,
      position,
      frequency,
      cid,
      callsign,
      aircraft
    });

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'register',
      resource: 'activity',
      resourceId: req.params.id,
      details: JSON.stringify({ registrationType }),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: '报名成功'
    });
  } catch (err) {
    console.error('报名活动错误:', err);
    res.status(400).json({ message: err.message });
  }
});

// 取消报名
router.post('/:id/cancel', auth, async (req, res) => {
  try {
    await Activity.unregister(req.params.id, req.user.id);

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'cancel',
      resourceType: 'activity',
      resourceId: req.params.id,
      details: JSON.stringify({ action: '取消报名' }),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: '取消报名成功'
    });
  } catch (err) {
    console.error('取消报名错误:', err);
    res.status(400).json({ message: err.message });
  }
});

module.exports = router;
