import Router from 'koa-router'
import { renameSync, mkdirSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { auth } from '../middleware/auth.js'
import { uploadDir } from '../config/index.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const router = new Router({ prefix: '/api' })

router.post('/upload', auth, async (ctx) => {
  const file = ctx.request.files?.file
  if (!file) {
    ctx.status = 400
    ctx.body = { message: '请选择文件' }
    return
  }
  const f = Array.isArray(file) ? file[0] : file
  const srcPath = f.filepath || f.path
  if (!srcPath) {
    ctx.status = 400
    ctx.body = { message: '文件无效' }
    return
  }
  const dir = join(__dirname, '..', uploadDir)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const origName = f.originalFilename || f.name || 'file'
  const ext = origName.includes('.') ? origName.split('.').pop() : 'jpg'
  const filename = Date.now() + '-' + Math.random().toString(36).slice(2) + '.' + ext
  const destPath = join(dir, filename)
  renameSync(srcPath, destPath)
  ctx.body = { url: '/uploads/' + filename }
})

export default router
