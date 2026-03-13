import Router from 'koa-router'
import bcrypt from 'bcryptjs'
import { queryOne, query } from '../db.js'
import { auth } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/user' })

// GET /api/user/me 需要登录
router.get('/me', auth, async (ctx) => {
  const user = ctx.state.user
  ctx.body = {
    id: user.id,
    username: user.username,
    role: user.role
  }
})

// PUT /api/user/password 修改密码
router.put('/password', auth, async (ctx) => {
  const { oldPassword, newPassword } = ctx.request.body || {}
  if (!oldPassword || !newPassword) {
    ctx.status = 400
    ctx.body = { message: '请提供原密码和新密码' }
    return
  }
  if (newPassword.length < 6 || newPassword.length > 64) {
    ctx.status = 400
    ctx.body = { message: '新密码长度需为 6-64' }
    return
  }
  const row = await queryOne('SELECT password_hash FROM users WHERE id = ?', [ctx.state.user.id])
  if (!row || !bcrypt.compareSync(oldPassword, row.password_hash)) {
    ctx.status = 400
    ctx.body = { message: '原密码错误' }
    return
  }
  const hash = bcrypt.hashSync(newPassword, 10)
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, ctx.state.user.id])
  ctx.body = { message: '修改成功' }
})

export default router
