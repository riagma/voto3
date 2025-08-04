export function validarEsquema(esquema) {
  return (peticion, respuesta, siguiente) => {
    const resultado = esquema.safeParse(peticion.body);
    
    if (!resultado.success) {
      return respuesta.status(400).json({ 
        errores: resultado.error.format() 
      });
    }
    
    peticion.body = resultado.data;
    siguiente();
  };
}