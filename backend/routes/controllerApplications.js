const express = require('express');
const router = express.Router();
const ControllerApplication = require('../models/ControllerApplication');
const User = require('../models/User');
const { auth, requirePermission } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// 获取申请列表（需要 controller:view 权限）
router.get('/', auth, requirePermission('controller:view'), async (req, res) => {
  try {
    const { page = 1, pageSize = 10, status } = req.query;
    
    const result = await ControllerApplication.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      status
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('获取申请列表错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取我的申请
router.get('/my', auth, async (req, res) => {
  try {
    const applications = await ControllerApplication.findByUserId(req.user.id);
    
    res.json({
      success: true,
      data: applications
    });
  } catch (err) {
    console.error('获取我的申请错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取单个申请
router.get('/:id', auth, async (req, res) => {
  try {
    const application = await ControllerApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: '申请不存在' });
    }

    // 检查权限：有 controller:view 权限或申请本人可以查看
    const permissions = await User.getUserPermissions(req.user.id);
    const canViewAll = permissions.includes('controller:view');
    if (!canViewAll && application.userId !== req.user.id) {
      return res.status(403).json({ message: '无权查看此申请' });
    }

    res.json({
      success: true,
      data: application
    });
  } catch (err) {
    console.error('获取单个申请错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 提交申请
router.post('/', auth, async (req, res) => {
  try {
    const { cid, email, rating, experience, motivation } = req.body;

    // 检查是否已有待审核的申请
    const existingApplications = await ControllerApplication.findByUserId(req.user.id);
    const pendingApplication = existingApplications.find(app =>
      app.status === 'pending' || app.status === 'reviewing'
    );

    if (pendingApplication) {
      return res.status(400).json({ message: '您已有待审核的申请，请勿重复提交' });
    }

    // 使用当前用户的 CID
    const userCid = req.user.cid || cid;

    const application = await ControllerApplication.create({
      userId: req.user.id,
      cid: userCid,
      email,
      rating,
      experience: experience || '',
      motivation: motivation || ''
    });

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'create',
      resource: 'controller_application',
      resourceId: application.id,
      description: `提交管制员申请`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: application,
      message: '申请提交成功'
    });
  } catch (err) {
    console.error('提交申请错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 取消申请
router.delete('/:id', auth, async (req, res) => {
  try {
    const application = await ControllerApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: '申请不存在' });
    }

    if (application.userId !== req.user.id) {
      return res.status(403).json({ message: '无权删除此申请' });
    }

    if (application.status !== 'pending' && application.status !== 'reviewing') {
      return res.status(400).json({ message: '该申请状态不允许删除' });
    }

    // 直接删除申请记录
    await ControllerApplication.delete(req.params.id);

    res.json({
      success: true,
      message: '申请已删除'
    });
  } catch (err) {
    console.error('删除申请错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 审核申请（需要 controller:review 权限）
router.put('/:id/review', auth, requirePermission('controller:review'), async (req, res) => {
  try {
    const { status, reviewNotes } = req.body;

    if (!['approved', 'rejected', 'reviewing'].includes(status)) {
      return res.status(400).json({ message: '无效的审核状态' });
    }

    const application = await ControllerApplication.findById(req.params.id);
    if (!application) {
      return res.status(404).json({ message: '申请不存在' });
    }

    const updateData = {
      status,
      reviewNotes,
      reviewerId: req.user.id,
      reviewedAt: new Date()
    };

    const updatedApplication = await ControllerApplication.update(req.params.id, updateData);

    // 如果审核通过，可以给用户添加相应权限（可选）
    if (status === 'approved') {
      // 可以添加一些管制员相关权限
      await User.addPermission(application.userId, 'activity:create', req.user.id);
    }

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'review',
      resource: 'controller_application',
      resourceId: application.id,
      description: `审核管制员申请: ${status === 'approved' ? '通过' : '拒绝'}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: updatedApplication,
      message: status === 'approved' ? '申请已通过' : '申请已拒绝'
    });
  } catch (err) {
    console.error('审核申请错误:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
