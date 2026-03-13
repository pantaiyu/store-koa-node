import mysql from 'mysql2/promise'
import { db as dbConfig } from '../config/index.js'
import { runSchema, query } from '../db.js'
import bcrypt from 'bcryptjs'
async function main() {
  try {
    const { database, ...connConfig } = dbConfig
    const conn = await mysql.createConnection({ ...connConfig })
    await conn.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
    await conn.end()
    console.log('Database ready:', database)

    await runSchema()
    console.log('Schema executed.')
    const existing = await query('SELECT id FROM users WHERE username = ?', ['admin'])
    if (existing.length === 0) {
      const hash = bcrypt.hashSync('admin123', 10)
      await query('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', hash, 'admin'])
      console.log('Default admin created: username=admin, password=admin123')
    } else {
      console.log('Admin user already exists.')
    }
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
  process.exit(0)
}

main()
