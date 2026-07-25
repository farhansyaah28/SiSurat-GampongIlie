const JenisSurat = require('../models/JenisSurat');

class JenisSuratController {
  static async getAll(req, res) {
    try {
      const jenis = await JenisSurat.getAll();

      res.status(200).json({
        success: true,
        data: jenis
      });
    } catch (error) {
      console.error('Get jenis surat error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  }

  static async getById(req, res) {
    try {
      const { id } = req.params;

      const jenis = await JenisSurat.findById(id);
      if (!jenis) {
        return res.status(404).json({
          success: false,
          message: 'Jenis surat tidak ditemukan'
        });
      }

      res.status(200).json({
        success: true,
        data: jenis
      });
    } catch (error) {
      console.error('Get jenis by id error:', error);
      res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan'
      });
    }
  }

  static async create(req, res) {
    try {
      const { nama_jenis, deskripsi, custom_fields, body_template, syarat_dokumen } = req.body;
      if (!nama_jenis) return res.status(400).json({ success: false, message: 'Nama jenis harus diisi' });

      const template_file = req.file ? `/uploads/${req.file.filename}` : null;

      const result = await JenisSurat.create({ nama_jenis, deskripsi, template_file, custom_fields, body_template, syarat_dokumen });
      res.status(201).json({ success: true, message: 'Jenis surat dibuat', data: { id_jenis: result.insertId } });
    } catch (error) {
      console.error('Create jenis error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
  }

  static async update(req, res) {
    try {
      const { id } = req.params;
      const { nama_jenis, deskripsi, status, custom_fields, body_template, syarat_dokumen } = req.body;
      if (!nama_jenis) return res.status(400).json({ success: false, message: 'Nama jenis harus diisi' });

      const updateData = { nama_jenis, deskripsi, status, custom_fields, body_template, syarat_dokumen };
      if (req.file) {
        updateData.template_file = `/uploads/${req.file.filename}`;
      }

      await JenisSurat.update(id, updateData);
      res.status(200).json({ success: true, message: 'Jenis surat diperbarui' });
    } catch (error) {
      console.error('Update jenis error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
  }

  static async remove(req, res) {
    try {
      const { id } = req.params;
      await JenisSurat.remove(id);
      res.status(200).json({ success: true, message: 'Jenis surat dihapus' });
    } catch (error) {
      console.error('Remove jenis error:', error);
      res.status(500).json({ success: false, message: 'Terjadi kesalahan' });
    }
  }
}

module.exports = JenisSuratController;
