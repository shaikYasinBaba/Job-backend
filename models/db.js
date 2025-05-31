// models/db.js
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const file = join(__dirname, '../db/db.json')
const adapter = new JSONFile(file)

// ✅ FIX: Pass default data here as second argument
const db = new Low(adapter, { users: [], jobs: [] })

await db.read()
await db.write()

export default db
