import { calcularPoseidon2 } from './utilesCrypto.js';

export class ArbolMerkle {
  
  constructor(hojas, funcionHash = (a, b) => calcularPoseidon2([a, b])) {
    if (!hojas.length) throw new Error("Debe haber al menos una hoja");
    this.funcionHash = funcionHash;
    this.niveles = [hojas.slice()];
    this.construirArbol();
  }

  construirArbol() {
    let actual = this.niveles[0];
    while (actual.length > 1) {
      const siguiente = [];
      for (let i = 0; i < actual.length; i += 2) {
        const izquierda = actual[i];
        const derecha = (i + 1 < actual.length) ? actual[i + 1] : actual[i];
        siguiente.push(this.funcionHash(izquierda, derecha));
      }
      this.niveles.unshift(siguiente);
      actual = siguiente;
    }
  }

  get raiz() {
    return this.niveles[0][0];
  }

  get hojas() {
    return this.niveles[this.niveles.length - 1];
  }

  get numHojas() {
    return this.niveles[this.niveles.length - 1].length;
  }

  //----------------------------------------------------------------------------

  generarPrueba(indice) {
    if (indice < 0 || indice >= this.niveles[this.niveles.length - 1].length) {
      throw new Error("Índice fuera de rango");
    }
    const path = [];
    const idxs = [];
    let idx = indice;
    for (let y = this.niveles.length - 1; y > 0; y--) {
      const nivel = this.niveles[y];
      const idxHermano = idx ^ 1; // idx ^ 1 => si idx es par → +1, impar → -1
      path.push(nivel[idxHermano] ?? nivel[idx]);
      idxs.push(idx % 2);
      idx = Math.floor(idx / 2);
    }
    return { path, idxs };
  }

  //----------------------------------------------------------------------------

  static verificarPrueba(
    clave, anulador, path, idxs, raiz, 
    funcionHash = (a, b) => calcularPoseidon2([a, b])) 
  {
    let hash = funcionHash(clave, anulador);

    for (let i = 0; i < path.length; i++) {
      if (idxs[i]) {
        hash = funcionHash(path[i], hash);
      } else {
        hash = funcionHash(hash, path[i]);
      }
    }
    return hash === raiz;
  }

  //----------------------------------------------------------------------------
  //----------------------------------------------------------------------------
}
