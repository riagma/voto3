#!/usr/bin/env node

import bcrypt from 'bcrypt';

const [, , ...args] = process.argv;

if (args.length === 0) {
  console.error('Uso: hash <contraseña>');
  process.exit(1);
}

const contraseña = args.join(' ');
const saltRounds = 10;

bcrypt.hash(contraseña, saltRounds)
  .then(hash => {
    console.log('Hash bcrypt generado:', hash);
  })
  .catch(err => {
    console.error('Error al generar el hash:', err);
    process.exit(1);
  });