const pool = require('../config/database');

class AuditLog {
  static async getAll(limit = 50, offset = 0) {
    const [rows] = await pool.execute(
      `SELECT al.id_log, al.id_user, al.aksi, al.deskripsi, al.tabel_target, al.id_target, al.ip_address,
              (al.created_at AT TIME ZONE 'UTC') as created_at,
              u.nama as nama_user, u.email as email_user
       FROM audit_log al
       LEFT JOIN users u ON al.id_user = u.id_user
       ORDER BY al.created_at DESC
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    return rows;
  }

  static async countAll() {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM audit_log`
    );
    return parseInt(rows[0].count || '0', 10);
  }
}

module.exports = AuditLog;
