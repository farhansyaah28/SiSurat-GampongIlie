

async function testNewPassword() {
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

  const testNIK = '12345' + Math.floor(10000000000 + Math.random() * 90000000000);
  const testName = 'Muhammad Ali';
  
  // Calculate expected password: name split first token lowercase + last 3 digits of NIK
  const expectedPassword = 'muhammad' + testNIK.substring(testNIK.length - 3);

  console.log(`\n2. Creating on-behalf for ${testName} (NIK: ${testNIK})...`);
  console.log(`Expected Auto Password: ${expectedPassword}`);

  let onBehalfRes = await fetch(base + '/pengajuan/on-behalf', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + operatorToken
    },
    body: JSON.stringify({
      is_new_user: true,
      new_user_data: {
        nama: testName,
        nik: testNIK,
        tempat_lahir: 'Banda Aceh',
        tanggal_lahir: '1995-05-15',
        jenis_kelamin: 'Laki-laki',
        agama: 'Islam',
        pekerjaan: 'Wiraswasta',
        status_perkawinan: 'Belum Kawin',
        alamat: 'Dusun Meunasah Tuha'
      },
      id_jenis: 2,
      keperluan: 'Mengurus Izin Usaha Kedai Kopi',
      keterangan: 'Ingin mengajukan surat keterangan usaha.'
    })
  });
  let onBehalfData = await onBehalfRes.json();
  if (!onBehalfData.success) {
    console.error('ERROR: On-behalf submission failed', onBehalfData);
    process.exit(1);
  }
  console.log(`✓ User registered & letter created successfully!`);

  console.log(`\n3. Verifying login with the auto-generated password: ${expectedPassword}...`);
  let citizenLoginRes = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: `${testNIK}@example.local`, password: expectedPassword })
  });
  let citizenLoginData = await citizenLoginRes.json();
  if (!citizenLoginData.token) {
    console.error('ERROR: Citizen login with auto-password failed!', citizenLoginData);
    process.exit(1);
  }
  console.log('✓ Citizen logged in successfully using auto-generated password!');
  console.log('\n======================================');
  console.log('SUCCESS! Custom auto-password test passed!');
  console.log('======================================');
  process.exit(0);
}

testNewPassword();
