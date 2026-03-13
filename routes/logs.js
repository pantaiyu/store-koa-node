import Router from 'koa-router'
import { query } from '../db.js'
import { auth } from '../middleware/auth.js'

const router = new Router({ prefix: '/api/logs' })

router.use(auth)

// GET /api/logs?type=in|out&warehouseId=&page=1&pageSize=20
router.get('/', async (ctx) => {
  const { type, warehouseId, page = 1, pageSize = 20 } = ctx.query
  const offset = (Math.max(1, Number(page)) - 1) * Math.min(100, Math.max(1, Number(pageSize)))
  const limit = Math.min(100, Math.max(1, Number(pageSize)))
  const conditions = []
  const params = []
  if (type === 'in' || type === 'out') {
    conditions.push('l.type = ?')
    params.push(type)
  }
  if (warehouseId && String(warehouseId).trim()) {
    conditions.push('l.warehouse_id = ?')
    params.push(warehouseId)
  }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : ''
  const list = await query(
    `SELECT l.id, l.type, l.item_id, l.warehouse_id, l.quantity, l.remark, l.created_at,
            u.username AS operatorName,
            w.name AS warehouseName,
            i.name AS itemName
     FROM operation_logs l
     LEFT JOIN users u ON l.operator_id = u.id
     LEFT JOIN warehouses w ON l.warehouse_id = w.id
     LEFT JOIN items i ON l.item_id = i.id
     ${where}
     ORDER BY l.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )
  const [{ total }] = await query(
    `SELECT COUNT(*) AS total FROM operation_logs l ${where}`,
    params
  )
  ctx.body = { list, total: Number(total) }
})

export default router
