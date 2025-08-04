import { z } from "zod";

// Enumerado para los estados de una elección
export const EstadosEleccion = {
  PENDIENTE: 'PENDIENTE',
  REGISTRO: 'REGISTRO',
  VOTACION: 'VOTACION',
  CERRADA: 'CERRADA'
};

// Esquema para Votante
export const esquemaVotante = z.object({
  dni: z.string().length(9, { message: "El DNI debe tener 9 caracteres" }),
  nombre: z.string().min(1, { message: "El nombre es obligatorio" }),
  primerApellido: z.string().min(1, { message: "El primer apellido es obligatorio" }),
  segundoApellido: z.string().min(1, { message: "El segundo apellido es obligatorio" }),
  correoElectronico: z.string().email({ message: "Email inválido" }).optional().nullable(),
  hashContrasena: z.string().min(60, { message: "Hash de contraseña inválido" }).optional().nullable()
});

export const esquemaContrasena = z.object({
  contrasenaActual: z.string().min(1, { message: "La contraseña actual es obligatoria" }),
  nuevaContrasena: z.string().min(1, { message: "La nueva contraseña es obligatoria" })
});

// Esquema para Elección
export const esquemaEleccion = z.object({
  nombre: z.string().min(1, { message: "El nombre de la elección es obligatorio" }),
  descripcion: z.string().min(1, { message: "La descripción es obligatoria" }),
  fechaInicioRegistro: z.string().datetime({ message: "Fecha de inicio de registro inválida" }),
  fechaFinRegistro: z.string().datetime({ message: "Fecha de fin de registro inválida" }),
  fechaInicioVotacion: z.string().datetime({ message: "Fecha de inicio de votación inválida" }),
  fechaFinVotacion: z.string().datetime({ message: "Fecha de fin de votación inválida" }),
  fechaEscrutinio: z.string().datetime({ message: "Fecha de celebración inválida" }),
  estado: z.enum(Object.values(EstadosEleccion), {
    message: "Estado de elección inválido"
  })
});

// Esquema para Partido
export const esquemaPartido = z.object({
  siglas: z.string().min(2, { message: "Las siglas son obligatorias" }),
  nombre: z.string().min(1, { message: "El nombre del partido es obligatorio" }),
  descripcion: z.string().min(1, { message: "La descripción es obligatoria" })
});

// Esquema para PartidoEleccion
export const esquemaPartidoEleccion = z.object({
  partidoId: z.string().min(1),
  eleccionId: z.number().int().positive()
});

// Esquema para RegistroVotanteEleccion
export const esquemaRegistroVotanteEleccion = z.object({
  votanteId: z.string().length(9),
  eleccionId: z.number().int().positive(),
  compromiso: z.string().min(1),
  compromisoTxId: z.string().min(1),
  fechaRegistro: z.string().datetime(),
  datosPrivados: z.string().optional().nullable()
});

// Esquema para RegistroVotanteEleccionPeticion
export const esquemaRegistroVotanteEleccionPeticion = esquemaRegistroVotanteEleccion.omit({
  votanteId: true,
  eleccionId: true,
  compromisoTxId: true,
  fechaRegistro: true
});

// Esquema para ResultadoEleccion
export const esquemaResultadoEleccion = z.object({
  eleccionId: z.number().int().positive(),
  censados: z.number().int().nonnegative(),
  votantes: z.number().int().nonnegative(),
  abstenciones: z.number().int().nonnegative(),
  votosBlancos: z.number().int().nonnegative(),
  votosNulos: z.number().int().nonnegative(),
  fechaRecuento: z.string().datetime()
});

// Esquema para ResultadoPartido
export const esquemaResultadoPartido = z.object({
  partidoId: z.string().min(1),
  eleccionId: z.number().int().positive(),
  votos: z.number().int().nonnegative(),
  porcentaje: z.number().min(0).max(100)
});

// Esquema para Administrador
export const esquemaAdministrador = z.object({
  correo: z.string().email({ message: "Email inválido" }),
  hashContrasena: z.string().min(60, { message: "Hash de contraseña inválido" })
});