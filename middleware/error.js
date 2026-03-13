import { isDev } from '../config/index.js'

export async function errorHandler(ctx, next) {
  try {
    await next()
  } catch (err) {
    ctx.status = err.status ?? 500
    ctx.body = {
      message: err.message || '服务器错误',
      ...(isDev && err.stack && { stack: err.stack })
    }
    ctx.app.emit('error', err, ctx)
  }
}
