# CTY垂天云飞控系统

一个用于虚拟飞行管制员管理和活动组织的Web应用系统。

## 技术栈

### 后端
- **Node.js** + **Express** - Web框架
- **MySQL** - 数据库
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **express-rate-limit** - 限流保护

### 前端
- **Vue 3** - 前端框架
- **Element Plus** - UI组件库
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Vite** - 构建工具
- **ECharts** - 图表库

## 功能特性

### 用户功能
- 用户注册/登录（支持CID）
- 个人资料管理
- 头像上传
- 密码修改

### 工单系统
- 提交工单（Bug反馈、功能建议、技术支持等）
- 工单列表查看
- 工单详情查看
- 管理员回复后自动关闭

### 活动系统
- 活动列表浏览
- 活动详情查看
- 活动报名/取消报名

### 管制员申请
- 提交管制员申请
- 申请状态跟踪
- 管理员审核（通过/拒绝）
- 用户可删除自己的申请

### 管理后台
- 用户管理
- 工单管理（查看、回复、删除）
- 活动管理（创建、编辑、删除）
- 管制员申请审核
- 权限管理（基于权限节点）
- 审计日志

## 安装部署

### 环境要求
- Node.js >= 16
- MySQL >= 5.7

### 后端部署

1. 进入后端目录
```bash
cd backend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑 .env 文件，配置数据库连接等信息
```

4. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 前端部署

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 配置API地址
编辑 `.env` 文件，配置后端API地址

4. 启动开发服务器
```bash
npm run dev
```

5. 构建生产版本
```bash
npm run build
```

## 数据库初始化

系统启动时会自动创建所需的表结构。如需手动执行SQL脚本，可在MySQL中运行：

```bash
mysql -u root -p cty < backend/scripts/update_all_tables_compatible.sql
```

## 目录结构

```
CTY垂天云飞控/
├── backend/              # 后端代码
│   ├── config/          # 配置文件
│   ├── middleware/      # 中间件
│   ├── models/          # 数据模型
│   ├── routes/          # 路由
│   ├── utils/           # 工具函数
│   ├── app.js           # 入口文件
│   └── package.json
├── frontend/             # 前端代码
│   ├── src/
│   │   ├── api/         # API接口
│   │   ├── components/  # 组件
│   │   ├── layouts/     # 布局
│   │   ├── router/      # 路由配置
│   │   ├── stores/      # Pinia状态
│   │   ├── utils/       # 工具函数
│   │   └── views/       # 页面视图
│   ├── index.html
│   └── package.json
└── README.md
```

## 默认端口

- 后端API: `http://localhost:3000`
- 前端开发服务器: `http://localhost:5173`

## 许可证

MIT License
