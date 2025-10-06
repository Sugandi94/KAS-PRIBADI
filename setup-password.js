// setup-password.js
const bcrypt = require('bcryptjs');
const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Masukkan password yang Anda inginkan: ', async (password) => {
  if (!password) {
    console.log('Password tidak boleh kosong.');
    rl.close();
    return;
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  const passwordFile = path.join(__dirname, 'db', 'password.json');
  
  await fs.mkdir(path.dirname(passwordFile), { recursive: true });
  
  await fs.writeFile(passwordFile, JSON.stringify({ hash: hashedPassword }, null, 2));
  console.log('Password berhasil disimpan di db/password.json');
  console.log('Anda bisa menghapus file setup-password.js sekarang.');
  rl.close();
});