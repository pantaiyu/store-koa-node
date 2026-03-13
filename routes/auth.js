import Router from 'koa-router'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { queryOne } from '../db.js'
import { jwtSecret, jwtExpiresIn } from '../config/index.js'

const router = new Router({ prefix: '/api/auth' })

// POST /api/auth/login
router.post('/login', async (ctx) => {
  const { username, password } = ctx.request.body || {}
  if (!username || !password) {
    ctx.status = 400
    ctx.body = { message: '请输入用户名和密码' }
    return
  }
  const user = await queryOne('SELECT id, username, password_hash, role FROM users WHERE username = ?', [username])
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    ctx.status = 401
    ctx.body = { message: '用户名或密码错误' }
    return
  }
  const token = jwt.sign(
    { userId: user.id },
    jwtSecret,
    { expiresIn: jwtExpiresIn }
  )
  ctx.body = {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  }
})

export default router
