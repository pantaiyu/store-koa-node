import mysql from 'mysql2/promise'
import { db as dbConfig } from './config/index.js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const pool = mysql.createPool({
  ...dbConfig,
  multipleStatements: true
})

export async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params)
  return rows
}

export async function queryOne(sql, params = []) {
  const rows = await query(sql, params)
  return rows[0] ?? null
}

export function getPool() {
  return pool
}

/** 执行 schema 文件（建表） */
export async function runSchema() {
  const schemaPath = join(__dirname, 'sql', 'schema.sql')
  const sql = readFileSync(schemaPath, 'utf8')
  const statements = sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'))
  for (const stmt of statements) {
    await pool.query(stmt)
  }
}

export default pool
