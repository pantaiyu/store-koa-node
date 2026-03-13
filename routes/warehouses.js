import Router from 'koa-router'
import { query, queryOne } from '../db.js'
import { auth, adminOnly } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/warehouses' })

// 所有接口需要登录
router.use(auth)

// GET /api/warehouses
router.get('/', async (ctx) => {
  const rows = await query(
    'SELECT id, name, description, created_at FROM warehouses ORDER BY id ASC'
  )
  ctx.body = rows
})

// GET /api/warehouses/:id
router.get('/:id', async (ctx) => {
  const id = ctx.params.id
  const row = await queryOne(
    'SELECT id, name, description, created_at FROM warehouses WHERE id = ?',
    [id]
  )
  if (!row) {
    ctx.status = 404
    ctx.body = { message: '仓库不存在' }
    return
  }
  ctx.body = row
})

// POST /api/warehouses 仅管理员
router.post('/', adminOnly, async (ctx) => {
  const { name, description } = ctx.request.body || {}
  if (!name || !name.trim()) {
    ctx.status = 400
    ctx.body = { message: '仓库名称不能为空' }
    return
  }
  const [r] = await query(
    'INSERT INTO warehouses (name, description) VALUES (?, ?)',
    [name.trim(), (description || '').trim()]
  )
  const row = await queryOne('SELECT id, name, description, created_at FROM warehouses WHERE id = ?', [r.insertId])
  ctx.status = 201
  ctx.body = row
})

// PUT /api/warehouses/:id 仅管理员
router.put('/:id', adminOnly, async (ctx) => {
  const id = ctx.params.id
  const { name, description } = ctx.request.body || {}
  const existing = await queryOne('SELECT id FROM warehouses WHERE id = ?', [id])
  if (!existing) {
    ctx.status = 404
    ctx.body = { message: '仓库不存在' }
    return
  }
  const n = (name || '').trim()
  if (!n) {
    ctx.status = 400
    ctx.body = { message: '仓库名称不能为空' }
    return
  }
  await query('UPDATE warehouses SET name = ?, description = ? WHERE id = ?', [n, (description || '').trim(), id])
  const row = await queryOne('SELECT id, name, description, created_at FROM warehouses WHERE id = ?', [id])
  ctx.body = row
})

// DELETE /api/warehouses/:id 仅管理员
router.delete('/:id', adminOnly, async (ctx) => {
  const id = ctx.params.id
  const existing = await queryOne('SELECT id FROM warehouses WHERE id = ?', [id])
  if (!existing) {
    ctx.status = 404
    ctx.body = { message: '仓库不存在' }
    return
  }
  await query('DELETE FROM operation_logs WHERE warehouse_id = ?', [id])
  await query('DELETE FROM items WHERE warehouse_id = ?', [id])
  await query('DELETE FROM warehouses WHERE id = ?', [id])
  ctx.body = { message: '删除成功' }
})

export default router
