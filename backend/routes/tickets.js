const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const User = require('../models/User');
const { auth, requirePermission } = require('../middleware/auth');
const AuditLog = require('../models/AuditLog');

// 获取工单列表
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, keyword, type, status, priority } = req.query;
    
    // 检查是否有 ticket:view 权限，有则可以看到所有工单
    const permissions = await User.getUserPermissions(req.user.id);
    const canViewAll = permissions.includes('ticket:view');
    const userId = canViewAll ? null : req.user.id;
    
    const result = await Ticket.findAll({
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      keyword,
      type,
      status,
      priority,
      userId
    });

    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  } catch (err) {
    console.error('获取工单列表错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取单个工单
router.get('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: '工单不存在' });
    }

    // 检查权限：有 ticket:view 权限或工单创建者可以查看
    const permissions = await User.getUserPermissions(req.user.id);
    const canViewAll = permissions.includes('ticket:view');
    if (!canViewAll && ticket.creatorId !== req.user.id) {
      return res.status(403).json({ message: '无权查看此工单' });
    }

    res.json({
      success: true,
      data: ticket
    });
  } catch (err) {
    console.error('获取工单详情错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 创建工单
router.post('/', auth, async (req, res) => {
  try {
    const ticketData = {
      ...req.body,
      creatorId: req.user.id
    };

    const ticket = await Ticket.create(ticketData);

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'create',
      resource: 'ticket',
      resourceId: ticket.id,
      description: `创建工单: ${ticket.title}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: ticket,
      message: '工单创建成功'
    });
  } catch (err) {
    console.error('创建工单错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 更新工单（需要 ticket:update 权限或者是创建者）
router.put('/:id', auth, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: '工单不存在' });
    }

    // 检查权限：有 ticket:update 权限或工单创建者可以修改
    const permissions = await User.getUserPermissions(req.user.id);
    const canUpdateAll = permissions.includes('ticket:update');
    if (!canUpdateAll && ticket.creatorId !== req.user.id) {
      return res.status(403).json({ message: '无权修改此工单' });
    }

    const updatedTicket = await Ticket.update(req.params.id, req.body);

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'ticket',
      resourceId: ticket.id,
      description: `更新工单: ${ticket.title}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: updatedTicket,
      message: '工单更新成功'
    });
  } catch (err) {
    console.error('更新工单错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 删除工单（需要 ticket:delete 权限）
router.delete('/:id', auth, requirePermission('ticket:delete'), async (req, res) => {
  try {
    const success = await Ticket.delete(req.params.id);
    if (!success) {
      return res.status(404).json({ message: '工单不存在' });
    }

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'delete',
      resource: 'ticket',
      resourceId: req.params.id,
      description: `删除工单`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      message: '工单删除成功'
    });
  } catch (err) {
    console.error('删除工单错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 获取工单评论列表
router.get('/:id/comments', auth, async (req, res) => {
  try {
    const ticketId = req.params.id;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: '工单不存在' });
    }

    // 检查权限
    const permissions = await User.getUserPermissions(req.user.id);
    const isAdmin = permissions.includes('ticket:update');
    const canView = isAdmin || ticket.creatorId === req.user.id;
    if (!canView) {
      return res.status(403).json({ message: '无权查看此工单的评论' });
    }

    const comments = await Ticket.getComments(ticketId, isAdmin);

    res.json({
      success: true,
      data: comments
    });
  } catch (err) {
    console.error('获取工单评论错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 添加工单评论
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { content } = req.body;
    const ticketId = req.params.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ message: '评论内容不能为空' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: '工单不存在' });
    }

    // 检查权限
    const permissions = await User.getUserPermissions(req.user.id);
    const isAdmin = permissions.includes('ticket:update');
    const canComment = isAdmin || ticket.creatorId === req.user.id;
    if (!canComment) {
      return res.status(403).json({ message: '无权评论此工单' });
    }

    // 如果是管理员回复，记录处理人并更新状态为处理中
    if (isAdmin && ticket.status === 'open') {
      await Ticket.handleTicket(ticketId, req.user.id);
    }

    // 添加评论
    const comment = await Ticket.addComment(ticketId, req.user.id, content.trim());

    // 如果是管理员回复，自动关闭工单（不支持多轮对话）
    if (isAdmin) {
      const formatDate = (date) => {
        const d = new Date(date)
        return d.toISOString().slice(0, 19).replace('T', ' ')
      }
      await Ticket.update(ticketId, { closedAt: formatDate(new Date()) });
    }

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'create',
      resource: 'ticket_comment',
      resourceId: ticketId,
      description: isAdmin ? `回复并关闭工单: ${ticket.title}` : `添加工单评论: ${ticket.title}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: comment,
      message: isAdmin ? '回复成功，工单已关闭' : '评论添加成功'
    });
  } catch (err) {
    console.error('添加工单评论错误:', err);
    res.status(500).json({ message: err.message });
  }
});

// 关闭工单
router.put('/:id/close', auth, async (req, res) => {
  try {
    const ticketId = req.params.id;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: '工单不存在' });
    }

    // 检查权限
    const permissions = await User.getUserPermissions(req.user.id);
    const canClose = permissions.includes('ticket:update') || ticket.creatorId === req.user.id;
    if (!canClose) {
      return res.status(403).json({ message: '无权关闭此工单' });
    }

    // 关闭工单
    const updatedTicket = await Ticket.update(ticketId, {
      status: 'closed',
      closedAt: new Date()
    });

    // 记录审计日志
    await AuditLog.create({
      userId: req.user.id,
      action: 'update',
      resource: 'ticket',
      resourceId: ticketId,
      description: `关闭工单: ${ticket.title}`,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });

    res.json({
      success: true,
      data: updatedTicket,
      message: '工单已关闭'
    });
  } catch (err) {
    console.error('关闭工单错误:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
