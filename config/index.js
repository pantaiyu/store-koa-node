import 'dotenv/config'

export const port = Number(process.env.PORT) || 3000
export const isDev = process.env.NODE_ENV !== 'production'
export const jwtSecret = process.env.JWT_SECRET || 'default-secret-change-me'
export const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d'

export const db = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_DATABASE || 'store_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}

export const uploadDir = process.env.UPLOAD_DIR || './uploads'
