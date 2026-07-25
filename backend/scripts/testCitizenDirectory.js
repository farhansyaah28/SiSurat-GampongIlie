async function testCitizenDirectory() {
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

  console.log('\n2. Listing citizens...');
  let listRes = await fetch(base + '/users?role=warga', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + operatorToken }
  });
  let listData = await listRes.json();
  if (!listData.success || !listData.data || listData.data.length === 0) {
    console.error('ERROR: Failed to list citizens', listData);
    process.exit(1);
  }
  console.log(`✓ Listed ${listData.data.length} citizens.`);

  // Find a test citizen
  const citizen = listData.data.find(w => w.nama.includes('Muhammad Ali')) || listData.data[0];
  const targetId = citizen.id_user;
  console.log(`✓ Selected citizen: ${citizen.nama} (ID: ${targetId}, NIK: ${citizen.nik})`);

  console.log(`\n3. Updating citizen Pekerjaan to 'PNS Gampong' (ID: ${targetId})...`);
  let updateRes = await fetch(base + `/users/${targetId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + operatorToken
    },
    body: JSON.stringify({
      nama: citizen.nama,
      nik: citizen.nik,
      email: citizen.email,
      status: 'aktif',
      tempat_lahir: citizen.tempat_lahir || 'Banda Aceh',
      tanggal_lahir: citizen.tanggal_lahir || '1995-05-15',
      jenis_kelamin: citizen.jenis_kelamin || 'Laki-laki',
      agama: citizen.agama || 'Islam',
      pekerjaan: 'PNS Gampong',
      status_perkawinan: citizen.status_perkawinan || 'Belum Kawin',
      alamat: citizen.alamat || 'Gampong Ilie'
    })
  });
  let updateData = await updateRes.json();
  if (!updateData.success) {
    console.error('ERROR: Update citizen failed', updateData);
    process.exit(1);
  }
  console.log('✓ Citizen profile updated successfully!');

  console.log(`\n4. Resetting password for citizen: ${citizen.nama}...`);
  let resetRes = await fetch(base + `/users/${targetId}/reset-password`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + operatorToken }
  });
  let resetData = await resetRes.json();
  if (!resetData.success || !resetData.newPassword) {
    console.error('ERROR: Reset password failed', resetData);
    process.exit(1);
  }
  const generatedPassword = resetData.newPassword;
  console.log(`✓ Password reset successfully! New Password: ${generatedPassword}`);

  console.log(`\n5. Verifying login with new password...`);
  let cLoginRes = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: citizen.email, password: generatedPassword })
  });
  let cLoginData = await cLoginRes.json();
  if (!cLoginData.token) {
    console.error('ERROR: Login verification failed with new password!', cLoginData);
    process.exit(1);
  }
  console.log('✓ Login verification successful!');

  console.log('\n======================================');
  console.log('SUCCESS! Citizen Directory APIs verified!');
  console.log('======================================');
  process.exit(0);
}

testCitizenDirectory();
