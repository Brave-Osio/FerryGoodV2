const bcrypt = require('bcryptjs');

async function main() {
  const passwords = [
    { username: 'admin',          password: 'Admin@123' },
    { username: 'register_staff', password: 'Register@123' },
    { username: 'client_user',    password: 'Client@123' },
  ];

  for (const { username, password } of passwords) {
    const hash = await bcrypt.hash(password, 12);
    console.log(`UPDATE Users SET PasswordHash = '${hash}' WHERE Username = '${username}';`);
  }
}

main();