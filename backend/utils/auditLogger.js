const db = require('../config/database');

/**
 * Log audit helper to save actions to audit_log table.
 * 
 * @param {Object} logData
 * @param {string|null} logData.nik - NIK of the user performing the action
 * @param {string|null} logData.id_user - ID/NIK of the user (for backward compatibility)
 * @param {string} logData.aksi - The action name (e.g., 'LOGIN_USER')
 * @param {string} logData.deskripsi - Detailed description of the action
 * @param {string|null} logData.tabel_target - Target table affected
 * @param {number|null} logData.id_target - Target ID affected
 * @param {string|null} logData.ip_address - IP address of the requester
 */
async function logAudit({ id_user, nik, aksi, deskripsi, tabel_target = null, id_target = null, ip_address = null }) {
  try {
    const targetNik = nik || id_user;
    await db.execute(
      `INSERT INTO audit_log (nik, aksi, deskripsi, tabel_target, id_target, ip_address) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [targetNik || null, aksi, deskripsi, tabel_target, id_target || null, ip_address]
    );
  } catch (error) {
    console.error('Failed to write audit log:', error.message);
  }
}

module.exports = { logAudit };
