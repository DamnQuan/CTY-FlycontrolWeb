const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');
const Ticket = require('../models/Ticket');
const ControllerApplication = require('../models/ControllerApplication');
const { auth, requirePermission } = require('../middleware/auth');

// 获取管理后台统计数据（需要任意管理权限）
router.get('/dashboard', auth, async (req, res) => {
  try {
    // 检查用户是否有任意管理权限
    const permissions = await User.getUserPermissions(req.user.id);
    const adminPermissions = ['user:view', 'activity:view', 'ticket:view', 'controller:view', 'audit:view', 'permission:view'];
    const hasAdminPermission = permissions.some(p => adminPermissions.includes(p));
    
    if (!hasAdminPermission) {
      return res.status(403).json({ message: '需要管理权限' });
    }

    const userStats = await User.getStats();
    const activityStats = await Activity.getStats();
    const ticketStats = await Ticket.getStats();
    const applicationStats = await ControllerApplication.getStats();

    const stats = {
      users: userStats,
      activities: activityStats,
      tickets: ticketStats,
      applications: applicationStats
    };

    // 获取最近的活动和工单
    const recentActivities = await Activity.getRecent(5);
    const recentTickets = await Ticket.getRecent(5);

    res.json({
      success: true,
      data: {
        stats,
        recent: {
          activities: recentActivities,
          tickets: recentTickets
        }
      }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
