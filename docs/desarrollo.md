# Desarrollo de voto3

## Arranque local

La raíz, `backend/` y `frontend/` tienen manifiestos npm independientes. Desde la raíz, instala sus dependencias con:

```bash
npm install
npm --prefix backend install
npm --prefix frontend install
```

Ejecuta `npm run dev` desde la raíz para iniciar el backend con Nodemon y el frontend con Vite. Para trabajar con uno solo, usa `npm --prefix backend run dev` o `npm --prefix frontend run dev`. Vite redirige las peticiones a `/api` al backend en `http://localhost:3000`. Antes de arrancar o probar el backend, comprueba que su configuración apunta a servicios de desarrollo.

## Comprobaciones

- Para cambios de frontend, compila con `npm --prefix frontend run build`. La salida habitual es `backend/public/` y Vite vacía ese directorio al compilar. Si solo quieres verificar la compilación, usa una ruta temporal desde la raíz:

  ```bash
  salida=$(mktemp -d)
  npm --prefix frontend run build -- --outDir "$salida"
  ```

- Para cambios de backend, prueba las rutas afectadas con datos de prueba. `backend/test/test-api.http` contiene ejemplos de peticiones. Revisa qué recursos toca cada petición antes de ejecutarla.
- Para cambios en Noir, revisa el proyecto afectado en `backend/src/noir/` y comprueba también el código JavaScript que consume sus artefactos.
- Para cambios en Algorand, consulta [la guía del subproyecto](../algorand/README.md). Comprueba el contrato y su cliente en LocalNet antes de considerar una red compartida.
- Los manifiestos npm no definen un script `test` común. Escoge las comprobaciones según el cambio y registra sus resultados.

## Flujo Git

1. Cambia a `main`, actualízala desde `origin` con `git pull --ff-only origin main` y crea desde ahí una rama como `feature/descripcion`.
2. Implementa y verifica el cambio en la rama de tarea. Haz allí los commits.
3. Actualiza `desa`, integra la rama de tarea con `git merge --no-ff feature/descripcion` y valida el resultado en desarrollo.
4. Tras validar desarrollo, actualiza `test` e integra directamente la misma rama de tarea. Tras validar preproducción, repite la integración directamente en `main`.
5. Si la tarea depende de cambios que ya están en otra rama de trabajo o surgen conflictos durante una integración, revisa esas dependencias antes de promoverla al siguiente entorno.

`tfm-entrega` identifica el estado entregado para el Trabajo de Fin de Máster.
