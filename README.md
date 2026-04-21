# CTY垂天云飞控系统

一个用于虚拟飞行管制员管理和活动组织的Web应用系统。

## 技术栈

### 后端
- **Node.js** + **Express** - Web框架
- **MySQL** - 数据库
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **express-rate-limit** - 限流保护
- **express-fileupload** - 文件上传

### 前端
- **Vue 3** + **Composition API** - 前端框架
- **Element Plus** - UI组件库
- **Pinia** - 状态管理
- **Vue Router** - 路由管理
- **Vite** - 构建工具
- **ECharts** - 图表库
- **SCSS** - CSS预处理器

## 功能特性

### 用户功能
- 用户注册/登录（支持CID）
- 个人资料管理（用户名、邮箱、CID、头像）
- 头像上传
- 密码修改（修改后自动退出登录）

### 工单系统
- 提交工单（Bug反馈、功能建议、技术支持等）
- 工单列表查看
- 工单详情查看（显示回复内容）
- 管理员回复后自动关闭
- 管理员可删除工单

### 活动系统
- 活动列表浏览（支持状态筛选：报名中、已开始、已结束）
- 活动详情查看
- 活动报名（分管制员和机组两种类型）
  - 管制员报名：席位呼号、频率、CID
  - 机组报名：呼号、机型、CID
- 取消报名
- 活动管理（创建、编辑、删除）

### 管制员申请
- 提交管制员申请（自动填充用户CID）
- 申请状态跟踪
- 管理员审核（通过/拒绝）
- 用户可删除自己的申请

### 管理后台
- **用户管理** - 查看用户列表、编辑用户信息、封禁用户
- **工单管理** - 查看、回复、删除工单
- **活动管理** - 创建、编辑、删除活动
- **管制员申请审核** - 通过/拒绝申请
- **权限管理** - 基于权限节点的细粒度权限控制，可直接为用户分配权限
- **审计日志** - 记录所有管理操作

## 权限系统

系统采用基于权限节点的访问控制，主要权限节点包括：

- `user:view`, `user:create`, `user:update`, `user:delete` - 用户管理
- `activity:view`, `activity:create`, `activity:update`, `activity:delete` - 活动管理
- `ticket:view`, `ticket:create`, `ticket:update`, `ticket:delete` - 工单管理
- `controller:view`, `controller:review` - 管制员申请管理
- `permission:view`, `permission:grant` - 权限管理
- `audit:view` - 审计日志查看

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
编辑 `.env` 文件，配置后端API地址：
```
VITE_API_BASE_URL=http://localhost:3000/api
```

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

### 为用户分配权限

给用户分配所有权限（以用户名为 `quanquan` 为例）：

```sql
-- 获取用户ID
SET @userId = (SELECT id FROM users WHERE username = 'quanquan' LIMIT 1);

-- 插入所有权限
INSERT INTO user_permissions (userId, permission, grantedBy, grantedAt) VALUES
(@userId, 'user:view', @userId, NOW()),
(@userId, 'user:create', @userId, NOW()),
(@userId, 'user:update', @userId, NOW()),
(@userId, 'user:delete', @userId, NOW()),
(@userId, 'activity:view', @userId, NOW()),
(@userId, 'activity:create', @userId, NOW()),
(@userId, 'activity:update', @userId, NOW()),
(@userId, 'activity:delete', @userId, NOW()),
(@userId, 'ticket:view', @userId, NOW()),
(@userId, 'ticket:create', @userId, NOW()),
(@userId, 'ticket:update', @userId, NOW()),
(@userId, 'ticket:delete', @userId, NOW()),
(@userId, 'controller:view', @userId, NOW()),
(@userId, 'controller:review', @userId, NOW()),
(@userId, 'permission:view', @userId, NOW()),
(@userId, 'permission:grant', @userId, NOW()),
(@userId, 'audit:view', @userId, NOW());
```

## 目录结构

```
CTY垂天云飞控/
├── backend/              # 后端代码
│   ├── config/          # 配置文件（数据库、上传等）
│   ├── middleware/      # 中间件（认证、限流等）
│   ├── models/          # 数据模型（User、Activity、Ticket等）
│   ├── routes/          # 路由（API接口）
│   ├── scripts/         # SQL脚本
│   ├── utils/           # 工具函数
│   ├── app.js           # 入口文件
│   └── package.json
├── frontend/             # 前端代码
│   ├── src/
│   │   ├── api/         # API接口封装
│   │   ├── components/  # 公共组件
│   │   ├── layouts/     # 布局组件
│   │   ├── router/      # 路由配置
│   │   ├── stores/      # Pinia状态管理
│   │   ├── utils/       # 工具函数
│   │   └── views/       # 页面视图
│   │       ├── auth/    # 登录注册页面
│   │       ├── admin/   # 管理后台页面
│   │       └── ...      # 其他页面
│   ├── index.html
│   └── package.json
└── README.md
```

## 默认端口

- 后端API: `http://localhost:3000`
- 前端开发服务器: `http://localhost:5173`

## 开发说明

### 代码规范
- 后端使用 CommonJS 模块规范
- 前端使用 ES6+ 语法和 Composition API
- 统一使用 async/await 处理异步操作
- API 响应格式统一为 `{ success: boolean, data: any, message: string }`

### 数据库字段命名
- 使用驼峰命名法（如 `userId`, `createdAt`）
- 时间字段使用 `createdAt`, `updatedAt`, `deletedAt` 等标准命名
- 布尔字段使用 `isActive`, `isDeleted` 等前缀

### 注意事项
- 所有管理操作都会记录审计日志
- 文件上传使用 `express-fileupload` 中间件
- 密码使用 bcryptjs 加密存储
- JWT Token 有效期默认为7天

## 许可证

MIT License
