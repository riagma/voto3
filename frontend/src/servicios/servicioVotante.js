import { api } from './api.js';
import { contexto } from '../modelo/contexto.js';
import { validarDatos, esquemaVotante } from '../modelo/esquemas.js';
import { notificarAccesoIdentificado } from '../componentes/accesoServidor.js';
import { servicioAlgorand } from './servicioAlgorand.js';
import { servicioLogin } from '../servicios/servicioLogin.js';
import { voto3IDB as idb } from '../modelo/voto3IDB.js';
import { calcularBloqueIndice } from '../utiles/utilesArbol.js';
import { servicioEleccion } from './servicioEleccion.js';
import { CLAVE_PRUEBAS, ESTADO_ELECCION } from '../utiles/constantes.js';
import { formatearFechaWeb } from '../utiles/utilesFechas.js';
import { calcularPruebaDatosPublicos } from '../utiles/utilesArbol.js';
import { mostrarSpinnerOverlay, ocultarSpinnerOverlay } from '../componentes/SpinnerOverlay.js';
import { encriptarConClavePublica, generarNonceHex, desencriptarConClavePrivada } from '../utiles/utilesCrypto.js';


import {
  randomBigInt,
  calcularPoseidon2,
  encriptarJSON,
  desencriptarJSON,
  desencriptarNodeJSON
} from '../utiles/utilesCrypto.js';


export const servicioVotante = {

  //------------------------------------------------------------------------------

  async cargarVotante() {
    try {
      const usuario = await idb.obtenerUsuario(contexto.getNombreUsuario());
      if (!usuario) {
        throw new Error('Usuario no encontrado en IDB');
      }
      let votantePlano = null;
      if (usuario.votante) {
        votantePlano = await desencriptarJSON(usuario.votante, servicioLogin.getClaveDerivada());
      } else {
        const credenciales = await notificarAccesoIdentificado({
          titulo: 'Recuperando datos del censo',
          disclaimer: 'Para recuperar los datos del censo, necesita verificar su identidad. Siempre que haya un acceso identificado le será notificado. El voto será completamente anónimo.'
        });

        if (!credenciales) {
          console.warn('Operación cancelada por el usuario');
          return null;
        }
        const votanteApi = await api.get('/api/votante', { credenciales });
        if (!votanteApi) {
          console.log('No se encontraron datos censales para el votante');
          return null;
        }
        console.log('Datos censales recuperados:', votanteApi);
        votantePlano = validarDatos(votanteApi, esquemaVotante);
        const votante = await encriptarJSON(votantePlano, servicioLogin.getClaveDerivada());
        await idb.actualizarUsuario(contexto.getNombreUsuario(), { votante });
      }
      if (votantePlano) {
        contexto.actualizarContexto({
          nombreVotante:
            votantePlano.nombre + ' ' +
            votantePlano.primerApellido + ' ' +
            votantePlano.segundoApellido
        });
      }
      return votantePlano;
    } catch (error) {
      console.error('Error al cargar el votante desde IDB:', error);
    }
  },

  //------------------------------------------------------------------------------

  async cargarCompromiso(idEleccion) {
    try {
      const credenciales = await notificarAccesoIdentificado({
        titulo: 'Recuperando datos de registro',
        disclaimer: 'Para recuperar los datos de registro en esta elección, necesita verificar su identidad. Siempre que haya un acceso identificado le será notificado. El voto será completamente anónimo.'
      });

      if (!credenciales) {
        console.warn('Operación cancelada por el usuario');
        return null;
      }
      const compromiso = await api.get(`/api/registro/${idEleccion}`, { credenciales });
      if (!compromiso) {
        console.log('No se encontraron datos de registro para la elección');
        return null;
      }
      console.log('Datos de compromiso recuperados:', compromiso);
      // return validarDatos(compromiso, esquemaRegistroVotante);
      return compromiso;
    } catch (error) {
      throw new Error('Error al cargar los datos del registro: ' + error.message);
    }
  },

  //------------------------------------------------------------------------------

  async cargarPruebaZK(idEleccion) {
    try {
      const pruebaZK = await api.get(`/api/eleccion/${idEleccion}/pruebaZK`);
      if (!pruebaZK) {
        console.log('No se encontraron datos de las pruebas ZK para la elección');
        return null;
      }
      console.log('Datos de las pruebas ZK:', pruebaZK);
      // return validarDatos(compromiso, esquemaRegistroVotante);
      return pruebaZK;
    } catch (error) {
      throw new Error('Error al cargar los datos del registro: ' + error.message);
    }
  },

  //------------------------------------------------------------------------------

  async cargarRaizZK(idEleccion, bloque) {
    try {
      const raizZK = await api.get(`/api/eleccion/${idEleccion}/raizZK/${bloque}`);
      if (!raizZK) {
        console.log('No se encontraron datos de la raíz ZK para la elección');
        return null;
      }
      console.log('Datos de la raíz ZK:', raizZK);
      // return validarDatos(compromiso, esquemaRegistroVotante);
      return raizZK;
    } catch (error) {
      throw new Error('Error al cargar los datos del registro: ' + error.message);
    }
  },

  //------------------------------------------------------------------------------

  async cargarVotoEleccion(cuentaAddr, assetId) {
    try {
      const respRecibida = await servicioAlgorand.consultarPapeletaRecibida(cuentaAddr, assetId);
      const respEnviada = await servicioAlgorand.consultarPapeletaEnviada(cuentaAddr, assetId);

      return {
        datePape: respRecibida ? respRecibida.date : null,
        txIdPape: respRecibida ? respRecibida.txId : null,

        dateVoto: respEnviada ? respEnviada.date : null,
        txIdVoto: respEnviada ? respEnviada.txId : null,

        notaVoto: respEnviada && respEnviada.nota ? respEnviada.nota.voto : null
      }

    } catch (error) {
      throw new Error('Error al cargar el voto de Algorand: ' + error.message);
    }
  },

  //------------------------------------------------------------------------------

  async cargarRegistroEleccion(idEleccion, eleccionParam = null, contratoParam = null) {
    try {
      let registro = await idb.obtenerRegistro(contexto.getNombreUsuario(), idEleccion);

      if (!registro) {

        registro = {};
        registro.nombreUsuario = contexto.getNombreUsuario();
        registro.eleccionId = idEleccion;
        registro.idSesion = "";

        await idb.crearRegistro(registro);
      }

      if (!registro.idSesion || registro.idSesion !== contexto.getIdSesion()) {

        registro.idSesion = contexto.getIdSesion();

        let eleccion = eleccionParam || await servicioEleccion.cargarEleccion(idEleccion);
        if (eleccion) {

          registro.claveVotoPublica = eleccion.claveVotoPublica;
          registro.claveVotoPrivada = eleccion.claveVotoPrivada;
        }

        let contrato = contratoParam || await servicioEleccion.cargarContrato(idEleccion);
        if (contrato) {

          registro.contratoAppId = contrato.appId;
          registro.contratoAppAddr = contrato.appAddr;
          registro.contratoAssetId = contrato.tokenId;
          registro.contratoAccAddr = contrato.accAddr;
        }

        const compromiso = await this.cargarCompromiso(idEleccion);
        if (compromiso) {
          registro.compromiso = compromiso.compromiso;
          registro.compromisoIdx = compromiso.compromisoIdx;
          registro.compromisoTxId = compromiso.compromisoTxId;
          registro.compromisoFecha = formatearFechaWeb(compromiso.fechaRegistro);
          registro.compromisoPrivado = compromiso.datosPrivados;
        } else {
          registro.compromiso = null;
          registro.compromisoIdx = null;
          registro.compromisoTxId = null;
          registro.compromisoFecha = null;
          registro.compromisoPrivado = null;
        }

        let mnemonico = null;
        registro.compromisoAddr = null;
        if (registro.compromisoPrivado) {
          const datosCompromiso = await desencriptarDatosCompromiso(registro.compromisoPrivado, idEleccion);
          if (datosCompromiso) {
            registro.compromisoAddr = datosCompromiso.cuentaAddr;
            mnemonico = datosCompromiso.mnemonico;
          }
        }

        if (registro.compromisoIdx != null) {
          const pruebaZK = await this.cargarPruebaZK(idEleccion);
          if (pruebaZK) {
            registro.urlCircuito = pruebaZK.urlCircuito;
            registro.ipfsCircuito = pruebaZK.ipfsCircuito;
            const { bloque, bloqueIdx } = calcularBloqueIndice(pruebaZK.tamBloque, pruebaZK.tamResto, registro.compromisoIdx);
            registro.compromisoBloque = bloque;
            registro.compromisoBloqueIdx = bloqueIdx;
          }
        }

        if (registro.compromisoBloque != null) {
          const raizZK = await this.cargarRaizZK(idEleccion, registro.compromisoBloque);
          if (raizZK) {
            registro.compromisoRaiz = raizZK.raiz;
            registro.compromisoRaizTxId = raizZK.txIdRaiz;
            registro.urlCompromisos = raizZK.urlCompromisos;
            registro.ipfsCompromisos = raizZK.ipfsCompromisos;
          }
        }

        if (registro.compromisoPrivado && registro.contratoAssetId) {
          const votoEleccion = await this.cargarVotoEleccion(registro.compromisoAddr, registro.contratoAssetId);
          if (votoEleccion) {
            registro.papeDate = votoEleccion.datePape ? formatearFechaWeb(votoEleccion.datePape) : null;
            registro.papeTxId = votoEleccion.txIdPape;
            registro.votoDate = votoEleccion.dateVoto ? formatearFechaWeb(votoEleccion.dateVoto) : null;
            registro.votoTxId = votoEleccion.txIdVoto;
            registro.votoNota = votoEleccion.notaVoto;
          }
        }

        if (mnemonico != null && registro.compromisoAddr != null &&
          (eleccion.estado === ESTADO_ELECCION.PASADA ||
            eleccion.estado === ESTADO_ELECCION.ACTUAL && registro.votoTxId !== null)) {
          await servicioAlgorand.destruirCuenta(
            mnemonico,
            registro.contratoAssetId,
            registro.contratoAppAddr,
            registro.contratoAccAddr
          );
        }

        await idb.actualizarRegistro(contexto.getNombreUsuario(), idEleccion, registro);
      }

      return registro;

    } catch (error) {
      throw new Error('Error creado datos de registro: ' + error.message);
    }
  },

  //------------------------------------------------------------------------------
  //------------------------------------------------------------------------------

  async crearCompromiso(idEleccion, compromiso, datosPrivados) {
    try {
      const credenciales = await notificarAccesoIdentificado({
        titulo: 'Registrarse en elección',
        disclaimer: 'Para registrarse en esta elección necesita verificar su identidad. Siempre que haya un acceso identificado le será notificado. El voto será completamente anónimo.'
      });

      if (!credenciales) {
        console.warn('Operación cancelada por el usuario');
        return null;
      }

      // await new Promise(resolve => setTimeout(resolve, 2000));
      // return null; // TODO Simulación de espera para pruebas

      mostrarSpinnerOverlay('Registrando, por favor espere...');
      const body = { compromiso, datosPrivados };
      const compromisoCreado = await api.put(`/api/registro/${idEleccion}`, body, { credenciales });
      if (!compromisoCreado) {
        console.log('No se encontraron datos de registro para la elección');
        return null;
      }
      console.log('Datos de compromiso recuperados:', compromisoCreado);
      // return validarDatos(compromiso, esquemaRegistroVotante);
      return compromisoCreado;
    } catch (error) {
      throw new Error('Error al cargar los datos del registro: ' + error.message);
    } finally {
      ocultarSpinnerOverlay();
    }
  },

  //------------------------------------------------------------------------------

  async registrarVotanteEleccion(idEleccion) {
    try {
      let registro = await this.cargarRegistroEleccion(idEleccion);
      if (!registro) {
        throw new Error('Registro no encontrado para la elección: ' + idEleccion);
      }

      const { compromiso, datosPrivados } = await generarDatosCompromiso();

      const registroCompromiso = await this.crearCompromiso(idEleccion, compromiso, datosPrivados);
      if (registroCompromiso) {
        registro.compromiso = registroCompromiso.compromiso;
        registro.compromisoIdx = registroCompromiso.compromisoIdx;
        registro.compromisoTxId = registroCompromiso.compromisoTxId;
        registro.compromisoFecha = formatearFechaWeb(registroCompromiso.fechaRegistro);
        registro.compromisoPrivado = registroCompromiso.datosPrivados;

        if (registro.compromisoIdx != null) {
          const pruebaZK = await this.cargarPruebaZK(idEleccion);
          if (pruebaZK) {
            registro.urlCircuito = pruebaZK.urlCircuito;
            registro.ipfsCircuito = pruebaZK.ipfsCircuito;
            const { bloque, bloqueIdx } = calcularBloqueIndice(pruebaZK.tamBloque, pruebaZK.tamResto, registro.compromisoIdx);
            registro.compromisoBloque = bloque;
            registro.compromisoBloqueIdx = bloqueIdx;
          }
        }

        if (registro.compromisoBloque != null) {
          const raizZK = await this.cargarRaizZK(idEleccion, registro.compromisoBloque);
          if (raizZK) {
            registro.compromisoRaiz = raizZK.raiz;
            registro.compromisoRaizTxId = raizZK.txIdRaiz;
            registro.urlCompromisos = raizZK.urlCompromisos;
            registro.ipfsCompromisos = raizZK.ipfsCompromisos;
          }
        }

        await idb.actualizarRegistro(contexto.getNombreUsuario(), idEleccion, registro);
      }

      return registro;

    } catch (error) {
      throw new Error('Error creado datos de registro: ' + error.message);
    }
  },

  //------------------------------------------------------------------------------
  //------------------------------------------------------------------------------

  async solicitarPapeletaEleccion(idEleccion) {
    try {
      mostrarSpinnerOverlay('Solicitando papeleta, por favor espere...');

      let registro = await this.cargarRegistroEleccion(idEleccion);
      if (!registro) {
        throw new Error('Registro no encontrado para la elección: ' + idEleccion);
      }

      if (!registro.compromiso || !registro.compromisoPrivado) {
        throw new Error('No se ha registrado el compromiso para la elección: ' + idEleccion);
      }

      if (registro.papeDate) {
        throw new Error('Ya ha recibido la papeleta para la elección: ' + idEleccion);
      }

      const datosCompromiso = await desencriptarDatosCompromiso(registro.compromisoPrivado);
      if (!datosCompromiso) {
        throw new Error('No se pudieron desencriptar los datos del compromiso');
      }

      const { balance, acepta, papeleta } =
        await servicioAlgorand.revisarCuenta(datosCompromiso.cuentaAddr, registro.contratoAssetId);

      //--------------

      if (!balance) {
        const { proof, publicInputs } = await calcularPruebaDatosPublicos(
          datosCompromiso.secreto,
          datosCompromiso.anulador,
          registro.compromisoBloqueIdx,
          registro.urlCircuito,
          registro.urlCompromisos);

        const bodyRegistrar = {
          cuentaAddr: datosCompromiso.cuentaAddr,
          proofBase64: btoa(String.fromCharCode(...proof)),
          publicInputs
        };
        const respRegistrar = await api.put(`/api/papeleta/${idEleccion}/registrar`, bodyRegistrar);
        if (!respRegistrar) {
          throw new Error('Error al registrar la papeleta en el servidor');
        }
        console.log('Papeleta registrada:', respRegistrar);
      } else {
        console.log('Ya se había registrado la papeleta para esta elección.');
      }

      //--------------

      if (!acepta) {
        // console.log("Haciendo opt-in...");
        // const txIdOptIn = await servicioAlgorand.hacerOptIn(datosCompromiso.mnemonico, registro.contratoAssetId);
        // console.log("Opt-in realizado con txID:", txIdOptIn);
        await servicioAlgorand.hacerOptIn(datosCompromiso.mnemonico, registro.contratoAssetId);
      } else {
        console.log("Ya se había hecho el opt-in para esta elección.");
      }

      //--------------

      if (!papeleta) {

        const anuladorHash = calcularPoseidon2([BigInt(datosCompromiso.anulador)]).toString();

        const bodySolicitar = {
          anulador: anuladorHash
        };
        const respSolicitar = await api.put(`/api/papeleta/${idEleccion}/solicitar`, bodySolicitar);
        if (!respSolicitar) {
          throw new Error('Error al solicitar la papeleta en el servidor');
        }
        console.log('Papeleta solicitada:', respSolicitar);

        registro.papeDate = respSolicitar.date ? formatearFechaWeb(respSolicitar.date) : null;
        registro.papeTxId = respSolicitar.txId ? respSolicitar.txId : null;

        await idb.actualizarRegistro(contexto.getNombreUsuario(), idEleccion, registro);

      } else {
        console.log('Ya se había solicitado la papeleta para esta elección.');
      }

      //--------------

      // const votoEleccion = await this.cargarVotoEleccion(registro.compromisoAddr, registro.contratoAssetId);
      // if (votoEleccion) {
      //   registro.papeDate = votoEleccion.datePape ? formatearFechaWeb(votoEleccion.datePape) : null;
      //   registro.papeTxId = votoEleccion.txIdPape;
      //   registro.votoDate = votoEleccion.dateVoto ? formatearFechaWeb(votoEleccion.dateVoto) : null;
      //   registro.votoTxId = votoEleccion.txIdVoto;
      //   registro.votoNota = votoEleccion.notaVoto;
      // }

      return registro;

    } catch (error) {
      throw new Error('Error creado datos de registro: ' + error.message);

    } finally {
      ocultarSpinnerOverlay();
    }
  },

  //------------------------------------------------------------------------------
  //------------------------------------------------------------------------------

  async emitirPapeletaEleccion(idEleccion, siglas) {
    try {
      mostrarSpinnerOverlay('Emitiendo papeleta votación, por favor espere...');

      let registro = await this.cargarRegistroEleccion(idEleccion);
      if (!registro) {
        throw new Error('Registro no encontrado para la elección: ' + idEleccion);
      }

      if (!registro.compromiso || !registro.compromisoPrivado) {
        throw new Error('No se ha registrado el compromiso para la elección: ' + idEleccion);
      }

      if (!registro.papeDate) {
        throw new Error('No ha solicitado la papeleta para la elección: ' + idEleccion);
      }

      if (registro.votoDate) {
        throw new Error('Ya ha emitido el voto para la elección: ' + idEleccion);
      }

      const datosCompromiso = await desencriptarDatosCompromiso(registro.compromisoPrivado);
      if (!datosCompromiso) {
        throw new Error('No se pudieron desencriptar los datos del compromiso');
      }

      const tieneAssetId = await servicioAlgorand.revisarAssetId(datosCompromiso.cuentaAddr, registro.contratoAssetId);

      if (!tieneAssetId) {
        throw new Error('No tiene la papeleta necesaria para votar en esta elección: ' + registro.contratoAssetId);
      }

      //--------------

      const nonce = generarNonceHex();

      const votoEnc = await encriptarConClavePublica(JSON.stringify({
        siglas: siglas,
        nonce: nonce
      }), registro.claveVotoPublica);

      const voto = { voto: votoEnc };

      const respVotar = await servicioAlgorand.votar(
        datosCompromiso.mnemonico,
        registro.contratoAssetId,
        registro.contratoAppAddr,
        voto
      );

      console.log("Voto emitido con txID:", respVotar.txId);

      registro.votoDate = respVotar.date ? formatearFechaWeb(respVotar.date) : null;
      registro.votoTxId = respVotar.txId ? respVotar.txId : null;
      registro.votoNota = respVotar.txId ? votoEnc : null;

      await idb.actualizarRegistro(contexto.getNombreUsuario(), idEleccion, registro);

      const respDestruir = await servicioAlgorand.destruirCuenta(
        datosCompromiso.mnemonico,
        registro.contratoAssetId,
        registro.contratoAppAddr,
        registro.contratoAccAddr
      );

      console.log("Cuenta destruida con txID:\n", respDestruir);

      return registro;

    } catch (error) {
      throw new Error('Error emitiendo la papeleta de voto: ' + error.message);

    } finally {
      ocultarSpinnerOverlay();
    }
  },

  //------------------------------------------------------------------------------

  async comprobarVotoEmitido(idEleccion) {
    try {
      mostrarSpinnerOverlay('Comprobando voto emitido, por favor espere...');

      let registro = await this.cargarRegistroEleccion(idEleccion);
      if (!registro) {
        throw new Error('Registro no encontrado para la elección: ' + idEleccion);
      }

      if (!registro.votoTxId) {
        throw new Error('No ha emitido el voto para la elección: ' + idEleccion);
      }

      if (!registro.claveVotoPrivada) {
        throw new Error('No se ha registrado la clave privada de voto para la elección: ' + idEleccion);
      }

      const votoEnc = await servicioAlgorand.consultarTransaccionVoto(registro.votoTxId);
      if (!votoEnc) {
        throw new Error('No se pudo recuperar la transacción de voto: ' + registro.votoTxId);
      }

      // console.log(`Votos:\n${votoEnc}\n${registro.votoNota}`);
      // console.log("Clave privada de voto:", registro.claveVotoPrivada);

      const votoTexto = await desencriptarConClavePrivada(votoEnc, registro.claveVotoPrivada);
      const voto = JSON.parse(votoTexto);
      if (!voto || !voto.siglas) {
        throw new Error('No se pudo desencriptar el voto de la transacción: ' + registro.votoTxId);
      }

      console.log("Voto emitido:", voto.siglas);

      return voto.siglas;

    } catch (error) {
      throw new Error('Error comprobando el voto emitido: ' + error.message);

    } finally {
      ocultarSpinnerOverlay();
    }
  },
}

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------

async function generarDatosCompromiso() {

  const { cuentaAddr, mnemonico } = servicioAlgorand.crearCuentaAleatoria();

  const secreto = randomBigInt();
  const anulador = randomBigInt();

  const compromiso = calcularPoseidon2([secreto, anulador]).toString();

  const datosPublicos = {
    cuentaAddr,
    mnemonico,
    secreto: secreto.toString(),
    anulador: anulador.toString(),
  };

  const datosPrivados = await encriptarJSON(datosPublicos, servicioLogin.getClaveDerivada());

  // console.log('Datos privados encriptados:', datosPrivados);
  // console.log('Datos privados desencriptados:', await desencriptarJSON(datosPrivados, servicioLogin.getClaveDerivada()));

  return { compromiso, datosPrivados };
}

//------------------------------------------------------------------------------

async function desencriptarDatosCompromiso(datosPrivados) {

  let datosCompromiso = null;

  // TODO: sólo a desencriptarJSON con claveDerivada cuando se acaben las pruebas

  try {
    if (!datosCompromiso) {
      datosCompromiso = await desencriptarNodeJSON(datosPrivados, CLAVE_PRUEBAS);
    }
  } catch (error) {
    // console.error('Error desencriptando los datos del compromiso con Node:', error);
    datosCompromiso = null;
  }

  try {
    if (!datosCompromiso) {
      datosCompromiso = await desencriptarJSON(datosPrivados, servicioLogin.getClaveDerivada());
    }
  } catch (error) {
    console.error('Error desencriptando los datos del compromiso:', error);
    datosCompromiso = null;
  }

  return datosCompromiso;
}

//------------------------------------------------------------------------------
//------------------------------------------------------------------------------