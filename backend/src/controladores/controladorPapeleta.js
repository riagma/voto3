import { calcularSha256 } from '../utiles/utilesCrypto.js';
import { registrarAnuladorEleccion } from '../algorand/registrarAnuladores.js';
import { solicitarPapeletaEleccion } from '../algorand/registrarAnuladores.js';

// import { guardarProofEnFichero } from '../utiles/utilesArbol.js';

export const controladorPapeleta = {

  //----------------------------------------------------------------------------

  async registrarSolicitudPapeleta(peticion, respuesta) {
    try {
      console.log(`Registrando solicitud para la elección ${peticion.params.idEleccion}`);

      const { cuentaAddr, proofBase64, publicInputs } = peticion.body;
      if (!cuentaAddr || !proofBase64 || !publicInputs) {
        return respuesta.status(400).json({ error: 'Cuenta, prueba y entradas públicas son requeridas' });
      }

      const proof = Buffer.from(proofBase64, 'base64');
      const proofHash = calcularSha256(proof);

      // TODO: comentar después de pruebas
      //-------------
      // console.log(cuentaAddr);
      // console.log(proofHash);
      // console.log(publicInputs);
      // const anulador_hash = BigInt(publicInputs[1]).toString();
      // await guardarProofEnFichero(proof, `proof_${anulador_hash}_rem.bin`);
      //-------------


      const resultadoRegistrar = await registrarAnuladorEleccion(peticion.bd, {
        eleccionId: parseInt(peticion.params.idEleccion),
        destinatario: cuentaAddr,
        proof,
        proofHash,
        publicInputs,
      });

      // console.log('Resultado del registro:', resultadoRegistrar);
      respuesta.json({ date: new Date(), txId: resultadoRegistrar.txId, proofHash });

    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------

  async completarSolicitudPapeleta(peticion, respuesta) {
    try {
      console.log(`Solicitando papeleta para la elección ${peticion.params.idEleccion}`);

      const { anulador } = peticion.body;
      if (!anulador) {
        return respuesta.status(400).json({ error: 'Anulador es requerido' });
      }

      console.log(anulador);

      const resultadoSolicitar = await solicitarPapeletaEleccion(peticion.bd, {
        eleccionId: parseInt(peticion.params.idEleccion),
        anulador,
      });

      console.log('Resultado de la solicitud:', resultadoSolicitar);
      respuesta.json({ date: new Date(), txId: resultadoSolicitar.txId, anulador });

    } catch (error) {
      respuesta.status(500).json({ error: error.message });
    }
  },

  //----------------------------------------------------------------------------
};