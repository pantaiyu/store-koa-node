import jwt from 'jsonwebtoken'
import { jwtSecret } from '../config/index.js'
import { queryOne } from '../db.js'

/**
 * 验证 JWT，将 user 挂到 ctx.state.user（不含 password_hash）
 */
export async function auth(ctx, next) {
  const authHeader = ctx.get('Authorization')
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) {
    ctx.status = 401
    ctx.body = { message: '未登录或 token 无效' }
    return
  }
  try {
    const decoded = jwt.verify(token, jwtSecret)
    const user = await queryOne(
      'SELECT id, username, role, created_at FROM users WHERE id = ?',
      [decoded.userId]
    )
    if (!user) {
      ctx.status = 401
      ctx.body = { message: '用户不存在' }
      return
    }
    ctx.state.user = user
    await next()
  } catch (e) {
    ctx.status = 401
    ctx.body = { message: '请重新登录' }
  }
}

/** 仅管理员可过 */
export async function adminOnly(ctx, next) {
  if (ctx.state.user?.role !== 'admin') {
    ctx.status = 403
    ctx.body = { message: '无权限' }
    return
  }
  await next()
}
