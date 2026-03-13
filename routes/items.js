import Router from 'koa-router'
import { query, queryOne } from '../db.js'
import { auth } from '../middleware/auth.js'

const router = new Router()
const api = new Router({ prefix: '/api' })

// 需要登录
api.use(auth)

// GET /api/warehouses/:warehouseId/items?page=1&pageSize=10&keyword=
api.get('/warehouses/:warehouseId/items', async (ctx) => {
  const { warehouseId } = ctx.params
  const { page = 1, pageSize = 10, keyword = '' } = ctx.query
  const offset = (Math.max(1, Number(page)) - 1) * Math.min(50, Math.max(1, Number(pageSize)))
  const limit = Math.min(50, Math.max(1, Number(pageSize)))
  const wh = await queryOne('SELECT id FROM warehouses WHERE id = ?', [warehouseId])
  if (!wh) {
    ctx.status = 404
    ctx.body = { message: '仓库不存在' }
    return
  }
  let listSql = 'SELECT id, warehouse_id, name, description, stock, images, created_at, updated_at FROM items WHERE warehouse_id = ?'
  const listParams = [warehouseId]
  if (keyword && String(keyword).trim()) {
    listSql += ' AND name LIKE ?'
    listParams.push('%' + String(keyword).trim() + '%')
  }
  listSql += ' ORDER BY id DESC LIMIT ? OFFSET ?'
  listParams.push(limit, offset)
  const list = await query(listSql, listParams)
  let countSql = 'SELECT COUNT(*) AS total FROM items WHERE warehouse_id = ?'
  const countParams = [warehouseId]
  if (keyword && String(keyword).trim()) {
    countSql += ' AND name LIKE ?'
    countParams.push('%' + String(keyword).trim() + '%')
  }
  const [{ total }] = await query(countSql, countParams)
  ctx.body = { list, total: Number(total) }
})

// GET /api/items/:id
api.get('/items/:id', async (ctx) => {
  const id = ctx.params.id
  const row = await queryOne(
    'SELECT id, warehouse_id, name, description, stock, images, created_at, updated_at FROM items WHERE id = ?',
    [id]
  )
  if (!row) {
    ctx.status = 404
    ctx.body = { message: '物品不存在' }
    return
  }
  ctx.body = row
})

// GET /api/items/:id/logs
api.get('/items/:id/logs', async (ctx) => {
  const itemId = ctx.params.id
  const item = await queryOne('SELECT id FROM items WHERE id = ?', [itemId])
  if (!item) {
    ctx.status = 404
    ctx.body = { message: '物品不存在' }
    return
  }
  const rows = await query(
    `SELECT l.id, l.type, l.quantity, l.remark, l.created_at, u.username AS operatorName
     FROM operation_logs l
     LEFT JOIN users u ON l.operator_id = u.id
     WHERE l.item_id = ?
     ORDER BY l.created_at DESC
     LIMIT 100`,
    [itemId]
  )
  ctx.body = rows.map((r) => ({
    ...r,
    operator: r.operatorName ? { username: r.operatorName } : null
  }))
})

// POST /api/items/in 存入
api.post('/items/in', async (ctx) => {
  const { warehouseId, name, quantity, remark, images } = ctx.request.body || {}
  if (!warehouseId || !name || !String(name).trim()) {
    ctx.status = 400
    ctx.body = { message: '请选择仓库并填写物品名称' }
    return
  }
  const qty = Math.max(0, Number(quantity) || 0)
  if (qty <= 0) {
    ctx.status = 400
    ctx.body = { message: '数量至少为 1' }
    return
  }
  const wh = await queryOne('SELECT id FROM warehouses WHERE id = ?', [warehouseId])
  if (!wh) {
    ctx.status = 404
    ctx.body = { message: '仓库不存在' }
    return
  }
  const nameTrim = String(name).trim()
  let item = await queryOne('SELECT id, stock FROM items WHERE warehouse_id = ? AND name = ?', [warehouseId, nameTrim])
  if (item) {
    if (images && (Array.isArray(images) ? images.length : images)) {
      await query('UPDATE items SET stock = stock + ?, images = ? WHERE id = ?', [
        qty,
        JSON.stringify(Array.isArray(images) ? images : [images]),
        item.id
      ])
    } else {
      await query('UPDATE items SET stock = stock + ? WHERE id = ?', [qty, item.id])
    }
    item = await queryOne('SELECT id, warehouse_id, name, description, stock, images, created_at FROM items WHERE id = ?', [item.id])
  } else {
    const [r] = await query(
      'INSERT INTO items (warehouse_id, name, description, stock, images) VALUES (?, ?, ?, ?, ?)',
      [warehouseId, nameTrim, '', qty, images ? JSON.stringify(images) : null]
    )
    item = await queryOne('SELECT id, warehouse_id, name, description, stock, images, created_at FROM items WHERE id = ?', [r.insertId])
  }
  await query(
    'INSERT INTO operation_logs (type, item_id, warehouse_id, quantity, operator_id, remark) VALUES (?, ?, ?, ?, ?, ?)',
    ['in', item.id, warehouseId, qty, ctx.state.user.id, (remark || '').trim()]
  )
  ctx.status = 201
  ctx.body = item
})

// POST /api/items/out 取出
api.post('/items/out', async (ctx) => {
  const { itemId, quantity, remark } = ctx.request.body || {}
  if (!itemId) {
    ctx.status = 400
    ctx.body = { message: '请选择物品' }
    return
  }
  const qty = Math.max(1, Number(quantity) || 0)
  const item = await queryOne('SELECT id, warehouse_id, stock FROM items WHERE id = ?', [itemId])
  if (!item) {
    ctx.status = 404
    ctx.body = { message: '物品不存在' }
    return
  }
  if (item.stock < qty) {
    ctx.status = 400
    ctx.body = { message: '库存不足' }
    return
  }
  await query('UPDATE items SET stock = stock - ? WHERE id = ?', [qty, itemId])
  await query(
    'INSERT INTO operation_logs (type, item_id, warehouse_id, quantity, operator_id, remark) VALUES (?, ?, ?, ?, ?, ?)',
    ['out', itemId, item.warehouse_id, qty, ctx.state.user.id, (remark || '').trim()]
  )
  ctx.body = { message: '取出成功' }
})

router.use(api.routes(), api.allowedMethods())
export default router
