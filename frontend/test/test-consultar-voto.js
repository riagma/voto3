import { servicioAlgorand } from "../src/servicios/servicioAlgorand.js"; 

const [,, assetId, cuentaAddr] = process.argv;

if (!assetId || !cuentaAddr) {
  console.error('Uso: node node ${process.argv[1]} <assetId> <cuentaAddr>');
  process.exit(1);
}

const { txId, nota } = servicioAlgorand.consultarPapeletaEnviada(cuentaAddr, assetId);

console.log('Transacción de papeleta enviada:', txId);
console.log('Nota de la transacción:', nota);
