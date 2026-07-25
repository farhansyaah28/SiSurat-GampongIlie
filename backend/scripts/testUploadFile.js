(async () => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const cp = require('child_process');
    const base = 'http://localhost:3000/api';
    function now(){return Date.now();}
    const email = `upload_${now()}@example.local`;
    const password = 'secret123';

    console.log('Register user for upload test:', email);
    const regCmd = ['-s', '-X', 'POST', base + '/auth/register', '-H', 'Content-Type: application/json', '-d', JSON.stringify({ nama: 'Upload Test', nik: String(now()).slice(0,16), email, password, confirmPassword: password })];
    let out = cp.spawnSync('curl', regCmd, { encoding: 'utf8' });
    if (out.error) throw out.error; console.log(out.stdout);

    const loginCmd = ['-s', '-X', 'POST', base + '/auth/login', '-H', 'Content-Type: application/json', '-d', JSON.stringify({ email, password })];
    out = cp.spawnSync('curl', loginCmd, { encoding: 'utf8' });
    if (out.error) throw out.error; const loginJson = JSON.parse(out.stdout || '{}'); if (!loginJson.token) throw new Error('login failed');
    const token = loginJson.token;

    console.log('Create pengajuan');
    out = cp.spawnSync('curl', ['-s', base + '/jenis-surat'], { encoding: 'utf8' });
    const jenisJson = JSON.parse(out.stdout || '{}'); const idJenis = jenisJson.data && jenisJson.data[0] ? jenisJson.data[0].id_jenis : 1;
    out = cp.spawnSync('curl', ['-s', '-X', 'POST', base + '/pengajuan', '-H', 'Content-Type: application/json', '-H', `Authorization: Bearer ${token}`, '-d', JSON.stringify({ id_jenis: idJenis, keperluan: 'Upload test', keterangan: 'Test upload file' })], { encoding: 'utf8' });
    const pj = JSON.parse(out.stdout || '{}'); if (!pj.success) throw new Error('create pengajuan failed');
    const idPengajuan = pj.data.id_pengajuan; console.log('Pengajuan id', idPengajuan);

    // create temp file
    const tmpDir = path.join(process.cwd(), 'tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
    const tmpFile = path.join(tmpDir, `testfile_${now()}.pdf`);
    fs.writeFileSync(tmpFile, '%PDF-1.4\n%âãÏÓ\n% test pdf content');

    // upload via curl (use system curl to avoid node multipart incompatibilities)
    console.log('Uploading file with curl', tmpFile);
    const curlArgs = ['-s', '-w', '%{http_code}', '-o', '-', '-X', 'POST', '-H', `Authorization: Bearer ${token}`, '-F', `file=@${tmpFile}`, `http://localhost:3000/api/pengajuan/${idPengajuan}/upload`];
    out = cp.spawnSync('curl', curlArgs, { encoding: 'utf8' });
    if (out.error) throw out.error;
    const body = out.stdout || '';
    const status = body.slice(-3);
    const respText = body.slice(0, -3) || '';
    console.log('Upload status', status);
    console.log(respText);

    // cleanup
    try { fs.unlinkSync(tmpFile); } catch(e){}
    console.log('Upload test finished');
  } catch (e) {
    console.error('ERROR', e);
    process.exit(1);
  }
})();
