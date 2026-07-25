const pool = require('../config/database');

async function run() {
  try {
    console.log('--- MENGHUBUNGI DATABASE UNTUK MENCARI USER OPERATOR ---');
    const [users] = await pool.execute('SELECT email, role FROM users WHERE role = ? LIMIT 1', ['operator']);
    if (!users.length) {
      console.error('ERROR: Tidak ada user dengan role operator di database. Silakan jalankan node scripts/testFlow.js terlebih dahulu.');
      process.exit(1);
    }
    const operatorEmail = users[0].email;
    console.log(`Menemukan Operator: ${operatorEmail}`);

    console.log('\n--- MENCOBA LOGIN SEBAGAI OPERATOR ---');
    const loginRes = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: operatorEmail,
        password: 'secret123'
      })
    });

    const loginData = await loginRes.json();
    const token = loginData.token;
    if (!token) {
      console.error('ERROR: Gagal login, token tidak didapatkan.', loginData);
      process.exit(1);
    }
    console.log('Login berhasil! Token didapatkan.');

    console.log('\n--- MENCOBA AMBIL DATA LOG AUDIT ---');
    const auditRes = await fetch('http://localhost:3000/api/audit-logs', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const auditData = await auditRes.json();
    console.log('Status Response:', auditRes.status);
    console.log('Success:', auditData.success);
    console.log('Pagination info:', auditData.pagination);
    console.log(`Jumlah log yang diambil: ${auditData.data ? auditData.data.length : 0}`);
    if (auditData.data && auditData.data.length > 0) {
      console.log('\nSample log terbaru:');
      console.log(JSON.stringify(auditData.data[0], null, 2));
    } else {
      console.log('Log audit kosong.');
    }

    console.log('\n--- MENCOBA AMBIL DATA DENGAN ROLE WARGA (SEHARUSNYA DITOLAK) ---');
    const [citizens] = await pool.execute('SELECT email FROM users WHERE role = ? LIMIT 1', ['warga']);
    if (citizens.length) {
      const citizenEmail = citizens[0].email;
      const citizenLoginRes = await fetch('http://localhost:3000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: citizenEmail,
          password: 'secret123'
        })
      });
      const citizenLoginData = await citizenLoginRes.json();
      const citizenToken = citizenLoginData.token;
      
      const citizenAuditRes = await fetch('http://localhost:3000/api/audit-logs', {
        headers: {
          Authorization: `Bearer ${citizenToken}`
        }
      });
      
      if (citizenAuditRes.ok) {
        console.error('ERROR: Warga bisa mengakses endpoint audit logs! Keamanan bocor.');
      } else {
        const errData = await citizenAuditRes.json();
        console.log(`Akses ditolak untuk warga (berhasil diblokir). Status: ${citizenAuditRes.status} (${errData.message || 'Forbidden'})`);
      }
    } else {
      console.log('Tidak ada user warga untuk diuji penolakannya.');
    }

    console.log('\nVERIFIKASI LOG AUDIT SELESAI DENGAN SUKSES!');
    process.exit(0);
  } catch (error) {
    console.error('Terjadi kesalahan:', error.message);
    process.exit(1);
  }
}

run();
