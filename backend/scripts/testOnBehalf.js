

async function testOnBehalf() {
  const base = 'http://localhost:3000/api';
  console.log('1. Logging in as Operator...');
  let loginRes = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'operator_1782917025450@example.local', password: 'secret123' })
  });
  let loginData = await loginRes.json();
  const operatorToken = loginData.token;
  if (!operatorToken) {
    console.error('ERROR: Operator login failed', loginData);
    process.exit(1);
  }
  console.log('✓ Operator logged in successfully');

  const testNIK = '9999' + Math.floor(100000000000 + Math.random() * 900000000000);
  console.log(`\n2. Creating on-behalf submission for new user (NIK: ${testNIK})...`);
  let onBehalfRes = await fetch(base + '/pengajuan/on-behalf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + operatorToken
    },
    body: JSON.stringify({
      is_new_user: true,
      new_user_data: {
        nama: 'Warga WalkIn Test',
        nik: testNIK,
        tempat_lahir: 'Banda Aceh',
        tanggal_lahir: '1995-05-15',
        jenis_kelamin: 'Laki-laki',
        agama: 'Islam',
        pekerjaan: 'Wiraswasta',
        status_perkawinan: 'Belum Kawin',
        alamat: 'Dusun Meunasah Tuha, Gampong Ilie'
      },
      id_jenis: 2,
      keperluan: 'Mengurus Izin Usaha Kedai Kopi (Walk-In)',
      keterangan: 'Ingin mengajukan surat keterangan usaha.'
    })
  });
  let onBehalfData = await onBehalfRes.json();
  if (!onBehalfData.success) {
    console.error('ERROR: On-behalf submission failed', onBehalfData);
    process.exit(1);
  }
  const id_pengajuan = onBehalfData.data.id_pengajuan;
  console.log(`✓ Submission created successfully! ID: ${id_pengajuan}, Status: ${onBehalfData.data.status}`);

  console.log('\n3. Logging in as Kepala Desa to approve...');
  loginRes = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'kepala_1782917025450@example.local', password: 'secret123' })
  });
  loginData = await loginRes.json();
  const kadesToken = loginData.token;
  if (!kadesToken) {
    console.error('ERROR: Kades login failed', loginData);
    process.exit(1);
  }
  console.log('✓ Kades logged in successfully');

  console.log(`\n4. Approving submission ID: ${id_pengajuan}...`);
  let appRes = await fetch(base + `/pengajuan/${id_pengajuan}/approve`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + kadesToken
    },
    body: JSON.stringify({})
  });
  let appData = await appRes.json();
  if (!appData.success) {
    console.error('ERROR: Approval failed', appData);
    process.exit(1);
  }
  console.log(`✓ Approved successfully! Generated Nomor: ${appData.nomor_surat}`);
  console.log(`✓ PDF URL: http://localhost:3000${appData.file}`);
  console.log('\n======================================');
  console.log('SUCCESS! On-behalf workflow test passed!');
  console.log('======================================');
  process.exit(0);
}

testOnBehalf();
