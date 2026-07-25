(async () => {
  try {
    const base = 'http://localhost:3000/api';
    const fetch = globalThis.fetch || (await import('node-fetch')).default;

    function now() { return Date.now(); }
    const wargaEmail = `warga_${now()}@example.local`;
    const operatorEmail = `operator_${now()}@example.local`;
    const kepalaEmail = `kepala_${now()}@example.local`;
    const password = 'secret123';

    console.log('Register warga:', wargaEmail);
    let res = await fetch(base + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: 'Warga Test', nik: String(now()).slice(0,16), email: wargaEmail, password, confirmPassword: password }) });
    console.log('->', res.status);
    console.log(await res.text());

    console.log('Login warga');
    res = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: wargaEmail, password }) });
    const loginWarga = await res.json();
    if (!loginWarga.token) throw new Error('Warga login failed');
    const wargaToken = loginWarga.token;

    console.log('Get jenis surat');
    res = await fetch(base + '/jenis-surat');
    const jenisList = await res.json();
    const idJenis = jenisList.success && jenisList.data && jenisList.data[0] ? jenisList.data[0].id_jenis : 1;

    console.log('Create pengajuan');
    res = await fetch(base + '/pengajuan', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + wargaToken }, body: JSON.stringify({ id_jenis: idJenis, keperluan: 'Keperluan testing', keterangan: 'Keterangan testing' }) });
    const pj = await res.json();
    if (!pj.success) throw new Error('Create pengajuan failed: ' + JSON.stringify(pj));
    const idPengajuan = pj.data.id_pengajuan;
    console.log('Pengajuan created id=', idPengajuan);

    // Create operator
    console.log('Register operator:', operatorEmail);
    res = await fetch(base + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: 'Operator Test', nik: String(now()).slice(0,16), email: operatorEmail, password, confirmPassword: password, role: 'operator' }) });
    console.log('->', res.status);
    console.log(await res.text());

    res = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: operatorEmail, password }) });
    const loginOp = await res.json(); if (!loginOp.token) throw new Error('Operator login failed');
    const opToken = loginOp.token;

    console.log('Operator verifikasi pengajuan');
    res = await fetch(base + `/pengajuan/${idPengajuan}/verifikasi`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + opToken }, body: JSON.stringify({ status: 'terverifikasi' }) });
    console.log('->', res.status, await res.text());

    // Create kepala desa
    console.log('Register kepala desa:', kepalaEmail);
    res = await fetch(base + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ nama: 'Kepala Test', nik: String(now()).slice(0,16), email: kepalaEmail, password, confirmPassword: password, role: 'kepala_desa' }) });
    console.log('->', res.status);
    console.log(await res.text());

    res = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: kepalaEmail, password }) });
    const loginKep = await res.json(); if (!loginKep.token) throw new Error('Kepala login failed');
    const kepalaToken = loginKep.token;

    console.log('Kepala approve pengajuan');
    res = await fetch(base + `/pengajuan/${idPengajuan}/approve`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + kepalaToken }, body: JSON.stringify({ nomor_surat: 'SURAT-2026/001' }) });
    console.log('->', res.status, await res.text());

    console.log('Generate PDF');
    res = await fetch(base + `/pengajuan/${idPengajuan}/generate`, { method: 'POST', headers: { 'Authorization': 'Bearer ' + kepalaToken } });
    const gen = await res.json();
    console.log('->', gen);

    if (gen.success && gen.file) {
      const fileUrl = 'http://localhost:3000' + gen.file;
      console.log('PDF available at', fileUrl);
    }

    console.log('Flow test completed successfully');
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
