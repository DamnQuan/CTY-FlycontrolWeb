const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Activity = require('../models/Activity');
const ControllerApplication = require('../models/ControllerApplication');

// 获取首页统计数据
router.get('/home', async (req, res) => {
  try {
    // 获取用户总数
    const userStats = await User.getStats();
    
    // 获取活动总数
    const activityStats = await Activity.getStats();
    
    // 获取已批准的管制员申请数量（作为管制员数量）
    const controllerCount = await ControllerApplication.getApprovedCount();

    res.json({
      success: true,
      data: {
        totalUsers: userStats.total,
        totalControllers: controllerCount,
        totalActivities: activityStats.total
      }
    });
  } catch (err) {
    console.error('获取统计数据错误:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
