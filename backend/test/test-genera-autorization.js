// genera-auth-basic.js
const [,, usuario, password] = process.argv;

if (!usuario || !password) {
  console.error('Uso: node node ${process.argv[1]} <usuario> <password>');
  process.exit(1);
}

const base64 = Buffer.from(`${usuario}:${password}`).toString('base64');
console.log(`Authorization: Basic ${base64}`);