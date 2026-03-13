import Koa from 'koa'
import koaBody from 'koa-body'
import cors from '@koa/cors'
import { errorHandler } from './middleware/error.js'
import authRouter from './routes/auth.js'
import userRouter from './routes/user.js'
import warehousesRouter from './routes/warehouses.js'
import itemsRouter from './routes/items.js'
import logsRouter from './routes/logs.js'
import uploadRouter from './routes/upload.js'
import { uploadDir } from './config/index.js'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { existsSync, mkdirSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = new Koa()

if (!existsSync(join(__dirname, 'tmp'))) mkdirSync(join(__dirname, 'tmp'), { recursive: true })
if (!existsSync(join(__dirname, uploadDir))) mkdirSync(join(__dirname, uploadDir), { recursive: true })

app.use(errorHandler)
app.use(cors({ origin: '*' }))
app.use(
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: join(__dirname, 'tmp'),
      keepExtensions: false
    }
  })
)

app.use(authRouter.routes()).use(authRouter.allowedMethods())
app.use(userRouter.routes()).use(userRouter.allowedMethods())
app.use(warehousesRouter.routes()).use(warehousesRouter.allowedMethods())
app.use(itemsRouter.routes()).use(itemsRouter.allowedMethods())
app.use(logsRouter.routes()).use(logsRouter.allowedMethods())
app.use(uploadRouter.routes()).use(uploadRouter.allowedMethods())

// 静态提供上传文件（前端通过 baseURL + /uploads/xxx 访问）
import serve from 'koa-static'
import mount from 'koa-mount'
const uploadsPath = join(__dirname, uploadDir)
app.use(mount('/uploads', serve(uploadsPath)))

export default app
