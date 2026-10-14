# Audio 1.2 — estabilidad durante partidas

El audio se sigue generando localmente con Web Audio. No se añadieron descargas,
archivos de sonido ni servicios externos, ni se cambió el guardado de cuentas.

## Problemas corregidos

- El secuenciador intentaba recuperar todos los pasos atrasados en un `while`.
  Si el hilo principal se bloqueaba, creaba muchas notas con tiempos pasados,
  provocando una ráfaga al recuperar el control. Ahora avanza sobre esos pasos
  sin reproducirlos, mantiene la fase musical y programa sólo 250 ms por delante,
  con un máximo de ocho pasos por ejecución.
- El límite anterior contaba llamadas a efectos durante 150 ms, no las fuentes
  reales. Algunos efectos tienen muchas fuentes y duran varios segundos. Ahora
  hay presupuestos independientes: hasta 48 fuentes musicales y 24 de efectos,
  incluyendo vibratos y notas programadas para más adelante. Los efectos que
  exceden el presupuesto se descartan, sin interrumpir la música.
- Cada nota/efecto tiene un propietario para sus osciladores, ruido, filtros,
  envolventes y envíos de reverberación. Al terminar se desconectan todos sus
  nodos. También se limpian por el reloj de audio si `onended` llega tarde.
- Los cambios de tema retiran también sus notas y envíos, con un máximo de dos
  buses en fundido, sin temporizadores individuales por efecto.
- Android y otros dispositivos móviles no usan el convolucionador de reverb
  estéreo largo. Se mantienen los instrumentos; sólo se elimina ese eco. En
  escritorio se utiliza una respuesta más corta y mono.
- `latencyHint: 'playback'` permite un búfer adecuado a la reproducción. Se deja
  más margen de mezcla: efectos menos amplificados, compresión y salida moderadas.
- Se dejan de sintetizar notas al silenciar o poner la música en cero. Al volver
  a activarla se saltan los pasos atrasados.
- `visibilitychange` y `appStateChange` suspenden y limpian el audio en segundo
  plano. Al regresar se reanuda el mismo contexto, sin crear contextos nuevos ni
  reproducir sonidos antiguos. Un nuevo gesto permite volver a intentar el
  desbloqueo si el sistema exige interacción.

## Pruebas

```bash
npm test                 # cuentas + nueve pruebas de audio con reloj controlado
npx playwright install chromium
npm run test:audio       # prueba con Web Audio real, ~45 segundos
npm run build:web        # actualiza la página minificada incluida en el APK
npm run test:browser     # regresión de cuentas en la página de producción
```

- Diez minutos **simulados** de combate, efectos simultáneos, todas las canciones
  y cambios de tema: fuentes siempre dentro del presupuesto y cero nodos
  temporales tras terminar.
- Bloqueo simulado de 30 segundos: no se programan fuentes con tiempos pasados.
- Limpieza por fin de fuente y por reloj, silenciamiento, sonidos largos,
  cambios rápidos de tema e interrupción/reanudación del contexto.
- Chromium con Web Audio real, perfil móvil, volumen máximo, cuatro temas y
  ráfagas intensas de efectos. Incluye bloqueos deliberados de 850 ms del hilo
  principal. Se comprueba señal audible después de cada bloqueo y al reanudar,
  pico inferior a 1, ausencia de errores y liberación final de nodos.

En la primera ejecución local de esa prueba real, el mayor pico medido después
del compresor fue 0,711 (antes de la atenuación final a 0,8). Las muestras varían
por el ruido sintetizado aleatoriamente. CI repite la prueba antes de publicar.
No sustituye una prueba auditiva en el teléfono concreto del usuario: el driver,
el WebView y la carga de renderizado pueden variar entre dispositivos.

## Instalación

Android: `versionCode=3`, `versionName=1.2-offline`. Se mantiene el mismo ID de
aplicación y el esquema de cuentas. Las compilaciones siguen siendo debug; una
firma distinta impide actualizar encima de una versión anterior. **No desinstalar
una app con progreso que se quiera conservar** para resolver ese conflicto.
Ver `OFFLINE-ACCOUNTS.md`.
