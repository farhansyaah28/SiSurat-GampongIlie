const AuditLog = require('../models/AuditLog');

class AuditLogController {
  static async getAll(req, res) {
    try {
      const page = parseInt(req.query.page || '1', 10);
      const limit = parseInt(req.query.limit || '20', 10);
      const offset = (page - 1) * limit;

      const logs = await AuditLog.getAll(limit, offset);
      const totalData = await AuditLog.countAll();
      const totalPages = Math.ceil(totalData / limit);

      res.status(200).json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          totalData,
          totalPages
        }
      });
    } catch (error) {
      console.error('Get audit logs controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat mengambil log audit'
      });
    }
  }
}

module.exports = AuditLogController;
