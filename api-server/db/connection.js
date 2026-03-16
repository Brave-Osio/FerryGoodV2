// db/connection.js — Microsoft Access connection via node-adodb (ACEOLEDB)
const ADODB = require('node-adodb');
require('dotenv').config();

const DB_PATH = process.env.DB_PATH || 'C:\\Users\\Brave\\Documents\\Visual Studio Code\\FerryGoodV2\\FerryGoodV2\\database\\FerryGood.accdb';
const DB_PASSWORD = process.env.DB_PASSWORD || '';

// Build the OLE DB connection string
function buildConnectionString() {
  let connStr = `Provider=Microsoft.ACE.OLEDB.12.0;Data Source=${DB_PATH};Persist Security Info=False;`;
  if (DB_PASSWORD) {
    connStr += `Jet OLEDB:Database Password=${DB_PASSWORD};`;
  }
  return connStr;
}

// Create a connection instance
function getConnection() {
  return ADODB.open(buildConnectionString());
}

/**
 * Execute a SELECT query and return rows as an array of objects.
 * @param {string} sql  - SQL query string
 * @param {object} [params] - Named parameters to replace (simple string replace, Access doesn't support ? params natively)
 * @returns {Promise<Array>}
 */
async function query(sql, params = {}) {
  // Simple named parameter substitution (e.g. :userId → value)
  let finalSQL = sql;
  for (const [key, value] of Object.entries(params)) {
    const escaped = typeof value === 'string'
      ? `'${value.replace(/'/g, "''")}'`
      : value === null || value === undefined
        ? 'NULL'
        : String(value);
    finalSQL = finalSQL.replace(new RegExp(`:${key}`, 'g'), escaped);
  }

  const conn = getConnection();
  try {
    const result = await conn.query(finalSQL);
    return result || [];
  } catch (err) {
    console.error('[DB Query Error]', err.message, '\nSQL:', finalSQL);
    throw new Error(`Database query failed: ${err.message}`);
  }
}

/**
 * Execute an INSERT, UPDATE, or DELETE and return { rowsAffected }.
 * @param {string} sql
 * @param {object} [params]
 * @returns {Promise<{ rowsAffected: number }>}
 */
async function execute(sql, params = {}) {
  let finalSQL = sql;
  for (const [key, value] of Object.entries(params)) {
    const escaped = typeof value === 'string'
      ? `'${value.replace(/'/g, "''")}'`
      : value === null || value === undefined
        ? 'NULL'
        : value instanceof Date
          ? `#${value.toISOString().replace('T', ' ').substring(0, 19)}#`
          : String(value);
    finalSQL = finalSQL.replace(new RegExp(`:${key}`, 'g'), escaped);
  }

  const conn = getConnection();
  try {
    await conn.execute(finalSQL);
    return { success: true };
  } catch (err) {
    console.error('[DB Execute Error]', err.message, '\nSQL:', finalSQL);
    throw new Error(`Database execute failed: ${err.message}`);
  }
}

/**
 * Get the last inserted AutoIncrement ID.
 * Access uses @@IDENTITY after an INSERT.
 */
async function getLastInsertId() {
  const result = await query('SELECT @@IDENTITY AS LastID');
  return result[0]?.LastID ?? null;
}

/**
 * Escape a value for safe insertion into Access SQL.
 */
function escapeValue(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'boolean') return value ? '-1' : '0';
  if (typeof value === 'number') return String(value);
  if (value instanceof Date) return `#${value.toISOString().replace('T', ' ').substring(0, 19)}#`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

module.exports = { query, execute, getLastInsertId, escapeValue };