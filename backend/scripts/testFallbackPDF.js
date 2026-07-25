require('dotenv').config();
const pool = require('../config/database');

async function run() {
  try {
    console.log('1. Clearing template_file for id_jenis = 2 to enforce fallback PDF generation...');
    await pool.execute(
      "UPDATE jenis_surat SET template_file = NULL WHERE id_jenis = 2"
    );
    console.log('✓ Updated id_jenis = 2 template_file to NULL');

    console.log('\n2. Finding user kepala_desa to approve letter...');
    const [kades] = await pool.execute('SELECT email FROM users WHERE role = ? LIMIT 1', ['kepala_desa']);
    if (!kades.length) {
      console.error('ERROR: Kepala Desa not found. Run testFlow.js first.');
      process.exit(1);
    }
    const kadesEmail = kades[0].email;
    console.log(`Kepala Desa email: ${kadesEmail}`);

    console.log('\n3. Logging in as Kepala Desa...');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: kadesEmail, password: 'secret123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;
    if (!token) {
      console.error('ERROR: Login failed', loginData);
      process.exit(1);
    }
    console.log('✓ Login successful');

    console.log('\n4. Creating a new fallback test submission (id_jenis = 2)...');
    const createRes = await fetch('http://localhost:3000/api/pengajuan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        id_jenis: 2,
        keperluan: 'Mengurus Kelengkapan Berkas Kuliah (Fallback Test)',
        keterangan: 'Ingin dibuatkan surat keterangan untuk diserahkan ke universitas.'
      })
    });
    const createData = await createRes.json();
    if (!createData.success) {
      console.error('ERROR: Failed to create submission', createData);
      process.exit(1);
    }
    const id = createData.data.id_pengajuan;
    console.log(`✓ Submission created successfully with ID: ${id}`);

    // Wait, since status is created as 'menunggu_verifikasi', does it need to be verified first?
    // Let's check: approve requires status to be 'terverifikasi' or can it approve directly?
    // Let's check PengajuanController.js approve method. It requires the status to be 'terverifikasi' or 'menunggu_persetujuan'.
    // Let's verify it first! Verifikasi is done by operator. Let's find an operator to verify first!
    console.log('\n5. Finding operator to verify the submission...');
    const [ops] = await pool.execute('SELECT email FROM users WHERE role = ? LIMIT 1', ['operator']);
    if (!ops.length) {
      console.error('ERROR: Operator not found.');
      process.exit(1);
    }
    const opEmail = ops[0].email;
    console.log(`Operator email: ${opEmail}`);

    console.log('Logging in as operator...');
    const opLoginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: opEmail, password: 'secret123' })
    });
    const opLoginData = await opLoginRes.json();
    const opToken = opLoginData.token;
    if (!opToken) {
      console.error('ERROR: Operator login failed', opLoginData);
      process.exit(1);
    }

    console.log('Verifying submission...');
    const verRes = await fetch(`http://localhost:3000/api/pengajuan/${id}/verifikasi`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${opToken}`
      },
      body: JSON.stringify({ status: 'terverifikasi' })
    });
    const verData = await verRes.json();
    if (!verData.success) {
      console.error('ERROR: Verification failed', verData);
      process.exit(1);
    }
    console.log('✓ Submission verified successfully');

    console.log('\n6. Approving the test submission as Kepala Desa...');
    const appRes = await fetch(`http://localhost:3000/api/pengajuan/${id}/approve`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({})
    });
    const appData = await appRes.json();
    if (!appData.success) {
      console.error('ERROR: Approval failed', appData);
      process.exit(1);
    }
    console.log('✓ Submission approved');

    console.log('\n7. Generating fallback PDF...');
    const genRes = await fetch(`http://localhost:3000/api/pengajuan/${id}/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    const genData = await genRes.json();
    console.log('Response:', genData);

    if (genData.success) {
      console.log('\n======================================================');
      console.log('SUCCESS! PDF fallback template generated successfully!');
      console.log('Download PDF from:', 'http://localhost:3000' + genData.file);
      console.log('======================================================');
      process.exit(0);
    } else {
      console.error('ERROR: PDF generation failed', genData);
      process.exit(1);
    }
  } catch (err) {
    console.error('Unhandled error:', err.message);
    process.exit(1);
  }
}

run();
