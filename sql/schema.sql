-- 仓库管理数据库结构（需先创建数据库 store_db 或在 .env 中配置 DB_DATABASE）
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64) NOT NULL UNIQUE,
  password_hash VARCHAR(128) NOT NULL,
  role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 仓库表
CREATE TABLE IF NOT EXISTS warehouses (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  description VARCHAR(512) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 物品表（按仓库+名称唯一）
CREATE TABLE IF NOT EXISTS items (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  warehouse_id INT UNSIGNED NOT NULL,
  name VARCHAR(128) NOT NULL,
  description VARCHAR(512) DEFAULT '',
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  images JSON DEFAULT NULL COMMENT '图片 URL 数组',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_warehouse_name (warehouse_id, name),
  KEY idx_warehouse_id (warehouse_id),
  KEY idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  type ENUM('in', 'out') NOT NULL,
  item_id INT UNSIGNED NOT NULL,
  warehouse_id INT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  operator_id INT UNSIGNED NOT NULL,
  remark VARCHAR(512) DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_warehouse_created (warehouse_id, created_at),
  KEY idx_item_id (item_id),
  KEY idx_type_created (type, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 初始管理员由 scripts/init-db.js 或首次启动时创建（用户名 admin，密码 admin123）
