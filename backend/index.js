import { iniciarServidor, cerrarServidor } from './src/app.js';

process.on('SIGTERM', cerrarServidor);
process.on('SIGINT', cerrarServidor);
process.on('SIGUSR2', cerrarServidor); // Para nodemon

await iniciarServidor()
  .catch(error => {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  });