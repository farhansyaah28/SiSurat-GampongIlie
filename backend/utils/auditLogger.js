const db = require('../config/database');

/**
 * Log audit helper to save actions to audit_log table.
 * 
 * @param {Object} logData
 * @param {number|null} logData.id_user - ID of the user performing the action
 * @param {string} logData.aksi - The action name (e.g., 'LOGIN_USER')
 * @param {string} logData.deskripsi - Detailed description of the action
 * @param {string|null} logData.tabel_target - Target table affected
 * @param {number|null} logData.id_target - Target ID affected
 * @param {string|null} logData.ip_address - IP address of the requester
 */
async function logAudit({ id_user, aksi, deskripsi, tabel_target = null, id_target = null, ip_address = null }) {
  try {
    await db.execute(
      `INSERT INTO audit_log (id_user, aksi, deskripsi, tabel_target, id_target, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id_user || null, aksi, deskripsi, tabel_target, id_target || null, ip_address]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
}

module.exports = { logAudit };
