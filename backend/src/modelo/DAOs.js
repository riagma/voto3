import { AdministradorDAO } from './daos/AdministradorDAO.js';
import { VotanteDAO } from './daos/VotanteDAO.js';
import { EleccionDAO } from './daos/EleccionDAO.js';
import { PartidoDAO } from './daos/PartidoDAO.js';
import { PartidoEleccionDAO } from './daos/PartidoEleccionDAO.js';
import { RegistroVotanteEleccionDAO } from './daos/RegistroVotanteEleccionDAO.js';
import { ResultadoEleccionDAO } from './daos/ResultadoEleccionDAO.js';
import { ResultadoPartidoDAO } from './daos/ResultadoPartidoDAO.js';
import { CuentaBlockchainDAO } from './daos/CuentaBlockchainDAO.js';
import { ContratoBlockchainDAO } from './daos/ContratoBlockchainDAO.js';
import { ContratoRecicladoDAO } from './daos/ContratoRecicladoDAO.js';
import { PruebaZKDAO } from './daos/PruebaZKDAO.js';
import { RaizZKDAO } from './daos/RaizZKDAO.js';
import { AnuladorZKDAO } from './daos/AnuladorZKDAO.js';
import { VotanteDatosEleccionDAO } from './daos/VotanteDatosEleccion.js';

// Creación de instancias singleton
const administradorDAO = new AdministradorDAO();
const votanteDAO = new VotanteDAO();
const eleccionDAO = new EleccionDAO();
const partidoDAO = new PartidoDAO();
const partidoEleccionDAO = new PartidoEleccionDAO();
const registroVotanteEleccionDAO = new RegistroVotanteEleccionDAO();
const resultadoEleccionDAO = new ResultadoEleccionDAO();
const resultadoPartidoDAO = new ResultadoPartidoDAO();
const cuentaBlockchainDAO = new CuentaBlockchainDAO();
const contratoBlockchainDAO = new ContratoBlockchainDAO();
const contratoRecicladoDAO = new ContratoRecicladoDAO();
const pruebaZKDAO = new PruebaZKDAO();
const raizZKDAO = new RaizZKDAO(); 
const anuladorZKDAO = new AnuladorZKDAO();
const votanteDatosEleccionDAO = new VotanteDatosEleccionDAO();

// Objeto inmutable con todos los DAOs
export const daos = Object.freeze({
  administrador: administradorDAO,
  votante: votanteDAO,
  eleccion: eleccionDAO,
  partido: partidoDAO,
  partidoEleccion: partidoEleccionDAO,
  registroVotanteEleccion: registroVotanteEleccionDAO,
  resultadoEleccion: resultadoEleccionDAO,
  resultadoPartido: resultadoPartidoDAO,
  cuentaBlockchain: cuentaBlockchainDAO,
  contratoBlockchain: contratoBlockchainDAO,
  contratoReciclado: contratoRecicladoDAO,
  pruebaZK: pruebaZKDAO,
  raizZK: raizZKDAO,
  anuladorZK: anuladorZKDAO,
  votanteDatosEleccion: votanteDatosEleccionDAO,    
});

// Exportación individual de DAOs
export {
  administradorDAO,
  votanteDAO,
  eleccionDAO,
  partidoDAO,
  partidoEleccionDAO,
  registroVotanteEleccionDAO,
  resultadoEleccionDAO,
  resultadoPartidoDAO,
  cuentaBlockchainDAO,
  contratoBlockchainDAO,
  contratoRecicladoDAO,
  pruebaZKDAO,
  raizZKDAO,
  anuladorZKDAO,
  votanteDatosEleccionDAO,
};