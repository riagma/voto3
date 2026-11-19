# Instrucciones para trabajar en voto3

Estas instrucciones se aplican a todo el repositorio y son compartidas por Codex y OpenCode. Antes de modificar el proyecto, lee [la guía de desarrollo](docs/desarrollo.md) para consultar el flujo Git y las comprobaciones del área que vas a tocar.

## Mapa del proyecto

- `frontend/` contiene la aplicación web en JavaScript y Vite. El punto de entrada es `frontend/src/main.js`.
- `backend/` contiene la API Express. El servidor arranca desde `backend/index.js` y sirve también el frontend compilado.
- `backend/src/noir/` contiene los proyectos Noir y sus artefactos. Cada circuito tiene su propio `Nargo.toml`.
- `algorand/` contiene el contrato de voto y su cliente. El contrato está en `algorand/smart_contracts/voto3/contract.py`.

## Cómo trabajar en una tarea

- Revisa la rama y los cambios locales antes de editar. Crea cada rama `feature/*` desde `main` actualizado y conserva el trabajo que ya exista en la copia local.
- Define el resultado esperado, limita los cambios a la tarea y revisa el diff antes de integrar. Haz los commits de trabajo en la rama de la tarea.
- Si cambia una interfaz entre el frontend, la API, los circuitos o el contrato, revisa los consumidores afectados. Regenera los artefactos desde sus fuentes cuando corresponda.
- Mantén credenciales, frases semilla, claves privadas y datos reales de votantes fuera de los cambios y las salidas de comprobación. Para pruebas con efectos sobre cuentas, votos, contratos o datos, usa un entorno local aislado y datos de prueba.
- Ejecuta las comprobaciones pertinentes y deja constancia de lo que se verificó y de lo que quedó pendiente.

## Integración

`desa` es desarrollo, `test` es preproducción y `main` es producción. Integra la rama de tarea directamente en cada entorno con `git merge --no-ff`, en ese orden y tras validar el entorno anterior. La referencia de la entrega del TFM es `tfm-entrega`.
