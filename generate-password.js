// generate-password.js
// Script untuk generate bcrypt password hash

const bcrypt = require('bcryptjs');

async function generatePasswordHash(password) {
  try {
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
    console.log('');
    console.log('Gunakan hash ini di query SQL:');
    console.log(`UPDATE super_admins SET password_hash = '${hash}' WHERE email = 'dirhamrozi@gmail.com';`);
  } catch (error) {
    console.error('Error generating hash:', error);
  }
}

// Ganti 'your_password_here' dengan password yang ingin Anda gunakan
const password = 'Dirham123!!!';
generatePasswordHash(password);