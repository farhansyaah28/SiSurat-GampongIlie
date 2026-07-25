(async ()=>{
  try {
    const fetch = globalThis.fetch || (await import('node-fetch')).default;
    const base = 'http://localhost:3000/api';

    const regBody = { nama: 'Test User', nik: '1234567890123456', email: 'testuser@example.local', password: 'secret123', confirmPassword: 'secret123' };
    const reg = await fetch(base + '/auth/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(regBody) });
    const regText = await reg.text();
    console.log('REGISTER STATUS', reg.status);
    console.log(regText);

    const loginBody = { email: 'testuser@example.local', password: 'secret123' };
    const login = await fetch(base + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(loginBody) });
    const loginText = await login.text();
    console.log('LOGIN STATUS', login.status);
    console.log(loginText);
  } catch (e) {
    console.error('ERROR', e);
  }
})();
