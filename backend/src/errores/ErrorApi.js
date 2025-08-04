export class ErrorApi extends Error {
  constructor(mensaje, codigo = 400) {
    super(mensaje);
    this.name = 'ErrorApi';
    this.codigo = codigo; // Código HTTP a devolver
  }
}