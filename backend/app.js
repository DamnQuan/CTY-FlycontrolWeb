const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const { initDatabase } = require('./config/database');
require('dotenv').config();

const app = express();

// 限流配置
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 1000, // 限制每个IP 15分钟内最多1000个请求
  message: '请求过于频繁，请稍后再试',
  validate: { xForwardedForHeader: false }
});

// 中间件
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(morgan('dev'));
app.use(limiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(fileUpload({
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  abortOnLimit: true
}));

// 静态文件
app.use('/uploads', express.static('uploads'));

// 初始化SQLite数据库并启动服务器
initDatabase()
  .then(() => {
    console.log('数据库初始化完成，启动服务器...');
  })
  .catch(err => {
    console.error('数据库初始化失败:', err);
    process.exit(1);
  });

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/activities', require('./routes/activities'));
app.use('/api/metar', require('./routes/metar'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/controller-applications', require('./routes/controllerApplications'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/audit-logs', require('./routes/auditLogs'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/permissions', require('./routes/permissions'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/stats', require('./routes/stats'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ message: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: '服务器内部错误',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});

module.exports = app;
