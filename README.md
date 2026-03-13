# 仓库管理后端 (Koa + MySQL)

## 技术栈

- Node.js + Koa
- mysql2
- JWT 认证
- bcryptjs 密码加密

## 环境要求

- Node.js >= 18
- MySQL >= 5.7 或 MariaDB

## 快速开始

1. 复制环境变量并修改：

```bash
cp .env.example .env
# 编辑 .env，填写 DB_HOST、DB_USER、DB_PASSWORD、DB_DATABASE、JWT_SECRET
```

2. 安装依赖并初始化数据库：

```bash
npm install
npm run init-db
```

初始化后会创建表结构，并创建默认管理员账号：**用户名 `admin`，密码 `admin123`**。

3. 启动服务：

```bash
npm run dev   # 开发（watch）
# 或
npm start     # 生产
```

服务默认运行在 `http://localhost:3000`。

## API 说明

与前端约定一致：

| 模块 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 登录 | POST | /api/auth/login | body: { username, password }，返回 token、user |
| 用户 | GET | /api/user/me | 需 token，返回当前用户 |
| 用户 | PUT | /api/user/password | 需 token，body: { oldPassword, newPassword } |
| 仓库 | GET | /api/warehouses | 列表 |
| 仓库 | GET | /api/warehouses/:id | 详情 |
| 仓库 | POST | /api/warehouses | 创建（管理员） |
| 仓库 | PUT | /api/warehouses/:id | 更新（管理员） |
| 仓库 | DELETE | /api/warehouses/:id | 删除（管理员） |
| 物品 | GET | /api/warehouses/:id/items | 分页、keyword 搜索 |
| 物品 | GET | /api/items/:id | 详情 |
| 物品 | GET | /api/items/:id/logs | 操作日志 |
| 物品 | POST | /api/items/in | 存入 |
| 物品 | POST | /api/items/out | 取出 |
| 上传 | POST | /api/upload | multipart file，需 token，返回 { url } |
| 日志 | GET | /api/logs | 筛选 type、warehouseId，分页 |

上传文件通过 `GET /uploads/:filename` 访问（静态目录为 `uploads/`）。

## 目录结构

```
koa-service/
├── config/         # 配置
├── middleware/     # 认证、错误处理
├── routes/         # 路由（auth、user、warehouses、items、logs、upload）
├── sql/            # 建表 SQL
├── scripts/       # init-db 等
├── app.js
├── index.js
└── db.js           # MySQL 连接池与查询
```
