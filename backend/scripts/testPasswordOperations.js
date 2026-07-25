async function testPasswordOperations() {
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

  const citizenId = 12; // Muhammad Ali
  console.log(`\n2. Performing Custom Password Reset for Citizen ID ${citizenId} to 'customPassword123'...`);
  let resetRes = await fetch(base + `/users/${citizenId}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + operatorToken
    },
    body: JSON.stringify({ password: 'customPassword123' })
  });
  let resetData = await resetRes.json();
  if (!resetData.success || resetData.newPassword !== 'customPassword123') {
    console.error('ERROR: Custom password reset failed!', resetData);
    process.exit(1);
  }
  console.log('✓ Custom password reset successful!');

  console.log('\n3. Verifying Resident Login with reset custom password...');
  let cLoginRes1 = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '1234584403991392@example.local', password: 'customPassword123' })
  });
  let cLoginData1 = await cLoginRes1.json();
  const citizenToken = cLoginData1.token;
  if (!citizenToken) {
    console.error('ERROR: Resident login failed with reset custom password!', cLoginData1);
    process.exit(1);
  }
  console.log('✓ Resident login successful!');

  console.log('\n4. Performing Self Password Change via profile update to \'selfChangedPassword456\'...');
  let updateRes = await fetch(base + '/auth/profile', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + citizenToken
    },
    body: JSON.stringify({
      nama: 'Muhammad Ali',
      tempat_lahir: 'Banda Aceh',
      tanggal_lahir: '1995-05-15',
      jenis_kelamin: 'Laki-laki',
      pekerjaan: 'PNS Gampong',
      status_perkawinan: 'Belum Kawin',
      agama: 'Islam',
      alamat: 'Dusun Meunasah Tuha',
      password: 'selfChangedPassword456'
    })
  });
  let updateData = await updateRes.json();
  if (!updateData.success) {
    console.error('ERROR: Self profile/password update failed!', updateData);
    process.exit(1);
  }
  console.log('✓ Self profile/password update successful!');

  console.log('\n5. Verifying Resident Login with newly changed password...');
  let cLoginRes2 = await fetch(base + '/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: '1234584403991392@example.local', password: 'selfChangedPassword456' })
  });
  let cLoginData2 = await cLoginRes2.json();
  if (!cLoginData2.token) {
    console.error('ERROR: Resident login failed with newly changed password!', cLoginData2);
    process.exit(1);
  }
  console.log('✓ Resident login with new password successful!');

  console.log('\n======================================');
  console.log('SUCCESS! Custom Reset & Self Change Passwords verified!');
  console.log('======================================');
  process.exit(0);
}

testPasswordOperations();
