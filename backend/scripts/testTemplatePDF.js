require('dotenv').config();
const fetch = globalThis.fetch || require('node-fetch');
const pool = require('../config/database');

(async () => {
  try {
    console.log('1. Setting up template image path in database...');
    // Update jenis_surat ID = 1 to point to our template file
    await pool.execute(
      "UPDATE jenis_surat SET template_file = '/uploads/letterhead_template.png' WHERE id_jenis = 1"
    );
    console.log('✓ Updated jenis_surat 1 with template_file');

    // Login to get operator/kepala_desa token
    const base = 'http://localhost:3000/api';
    console.log('2. Logging in as head of village...');
    const loginRes = await fetch(base + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@desa.local', password: 'admin123' })
    });
    const loginJson = await loginRes.json();
    if (!loginJson.token) {
      throw new Error('Failed to login as admin: ' + JSON.stringify(loginJson));
    }
    const token = loginJson.token;
    console.log('✓ Logged in as admin');

    // Create a new letter request for ID = 1
    console.log('3. Creating a new test pengajuan...');
    const pRes = await fetch(base + '/pengajuan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({
        id_jenis: 1,
        keperluan: 'Keperluan Testing Template Image',
        keterangan: 'Keterangan Testing Surat Domisili dengan background overlay'
      })
    });
    const pJson = await pRes.json();
    if (!pJson.success) {
      throw new Error('Failed to create pengajuan: ' + JSON.stringify(pJson));
    }
    const id = pJson.data.id_pengajuan;
    console.log('✓ Created pengajuan ID:', id);

    // Approve the pengajuan (to status 'disetujui')
    console.log('4. Approving pengajuan...');
    const appRes = await fetch(base + `/pengajuan/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token
      },
      body: JSON.stringify({ nomor_surat: `SRT-DOMISILI-${id}/2026` })
    });
    const appJson = await appRes.json();
    console.log('✓ Approve response:', appJson);

    // Generate PDF!
    console.log('5. Triggering PDF generation...');
    const genRes = await fetch(base + `/pengajuan/${id}/generate`, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const genJson = await genRes.json();
    console.log('✓ PDF Generation response:', genJson);

    if (genJson.success) {
      console.log('========================================================================');
      console.log('SUCCESS! PDF overlay template tested successfully!');
      console.log('Generated PDF is available at:', 'http://localhost:3000' + genJson.file);
      console.log('========================================================================');
    } else {
      throw new Error('PDF Generation failed: ' + JSON.stringify(genJson));
    }

    process.exit(0);
  } catch (err) {
    console.error('Error testing template PDF:', err);
    process.exit(1);
  }
})();
