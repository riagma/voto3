export class DatosVotanteEleccion {
  constructor({
    votanteId,
    eleccionId,
    // cuenta = '',
    // mnemonico = '',
    // secreto = '',
    // anulador = '',
    // anuladorHash = '',
    compromiso = '',
    compromisoIdx = 0,
    compromisoTxId = '',
    appId = '',
    appAddr = '',
    tokenId = '',
    numBloques = 0,
    tamBloque = 0,
    tamResto = 0,
    txIdRaizInicial = '',
    urlCircuito = '',
    bloque = 0,
    bloqueIdx = 0,
    raiz = '',
    txIdRaiz = '',
    urlCompromisos = '',
    proof = '',
    publicInputs = '',
    claveVotoPublica = '',
    voto = '',
    votoEnc = '',
    votoTxId = ''
  } = {}) {
    this.votanteId = votanteId;
    this.eleccionId = eleccionId;
    // this.cuentaAddr = cuentaAddr;
    // this.mnemonico = mnemonico;
    // this.secreto = secreto;
    // this.anulador = anulador;
    // this.anuladorHash = anuladorHash;
    this.compromiso = compromiso;
    this.compromisoIdx = compromisoIdx;
    this.compromisoTxId = compromisoTxId;
    this.appId = appId;
    this.appAddr = appAddr;
    this.tokenId = tokenId;
    this.numBloques = numBloques;
    this.tamBloque = tamBloque;
    this.tamResto = tamResto;
    this.txIdRaizInicial = txIdRaizInicial;
    this.urlCircuito = urlCircuito;
    this.bloque = bloque;
    this.bloqueIdx = bloqueIdx;
    this.raiz = raiz;
    this.txIdRaiz = txIdRaiz;
    this.urlCompromisos = urlCompromisos;
    this.proof = proof;
    this.publicInputs = publicInputs;
    this.claveVotoPublica = claveVotoPublica;
    this.voto = voto;
    this.votoEnc = votoEnc;
    this.votoTxId = votoTxId;
  }
}