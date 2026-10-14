# Notas del port a Android (PokeSurvivor)

Port nativo para Android, hecho con [Capacitor](https://capacitorjs.com/),
del juego web **PokéSurvivor** ([JPTER78/pokesurvivor](https://github.com/JPTER78/pokesurvivor)).
Capacitor envuelve el juego (que ya es 100% HTML/CSS/JS, un solo `<canvas>`)
en una WebView dentro de una app Android real: mismo motor, mismo código de
juego, pantalla completa, sin barra de navegador, ícono propio en el launcher,
splash screen, y el botón "atrás" de Android mapeado al menú de pausa en vez
de cerrar la app de golpe.

## Motor de juego y cambios del port

Todo lo que en el proyecto original está bajo licencia MIT (`js/`, `css/`,
`index.html`, `tools/`): cámara, físicas, IA de enemigos, oleadas, subida de
nivel, gacha, logros, misiones, clima, grietas/legendarios, HUD, menús,
ajustes y módulos de red. En la edición 1.1 se activaron exclusivamente las
cuentas locales, se mejoró su persistencia y se deshabilitaron los servicios
online. Ver [OFFLINE-ACCOUNTS.md](./OFFLINE-ACCOUNTS.md).

- `www/` = el sitio del juego, copiado del original (motor completo).
- `www/js/capacitor-bridge.js` = capa nativa: conecta el juego con los
  plugins nativos (oculta splash, oculta barra de estado, botón atrás →
  pausa). Si abres `www/` en un navegador normal (sin Capacitor), este
  archivo no hace nada: el juego sigue funcionando igual que siempre.
- `android/` = proyecto nativo generado por Capacitor (Gradle/Android Studio).

No se incluyeron las páginas estáticas de SEO del sitio original
(`pokedex/`, `guia/`, `legendarios/`, `tipos/`, `movimientos/`, etc.): son
páginas pensadas para que Google las indexe en la web, no aportan nada dentro
de una app empaquetada (el juego ya muestra esa misma información en sus
propios menús in-game). Si las quieres igualmente, están en el repo original
y se pueden copiar a `www/` sin cambios (también son código MIT).

## Assets importados

Se incluyeron los **13.468 sprites** de `assets/pokemon/` del commit
`b29708900da26b34e70d2dc07ad1659a719f4a78` de JPTER78/pokesurvivor, sin modificar.
Se guardan comprimidos en `vendor/pokemon.tar.gz` (~54 MiB) para evitar
versionar miles de imágenes sueltas. `npm install`, `npm ci` y `npm run sync`
los restauran automáticamente en `www/assets/pokemon/`; también puedes usar
`npm run assets:prepare`. Las imágenes extraídas permanecen ignoradas por Git.

Se preservan `www/LICENSE` y `www/CREDITS.md` del original: los sprites son
CC BY-NC 4.0 según ese repositorio (uso no comercial y atribución).
Se añadió `assets/og-image.jpg`; las fuentes ya eran idénticas al original.
Ver `vendor/README.md` para la procedencia y cómo verificar la importación.

## Elementos propios del port

**Iconos de la app (launcher, splash, favicon).** Los del proyecto original
usan una Poké Ball y se han conservado en `www/assets/upstream-icons/`,
sin activarlos. Para este port se generaron iconos 100%
nuevos y originales (un rayo pixel-art) para esta app, en
`www/assets/icons/` y `android/.../res/mipmap-*`. Cámbialos si quieres otro
estilo; el original está en `design-src/icon-master.png`.

**Meta-datos SEO/Open Graph/structured data** del `<head>` original (apuntaban
a `pokesurvivor.com`, imagen `og-image.jpg`, etc.): no aplican dentro de una
app nativa, así que se quitaron del `index.html` portado.

## Cómo compilarla

El workflow de GitHub Actions compila, prueba y publica el APK en GitHub
Releases. Para compilar localmente necesitas Android Studio/SDK y Java 17.

```bash
cd pokesurvivor-mobile
npm install                 # instala Capacitor y extrae los assets
npm run build:web           # genera index.html y app.min.js con cuentas offline
npm test
# 1) restaura los sprites incluidos y sincroniza:
npm run sync

# 2a) desde Android Studio:
npx cap open android        # abre android/ en Android Studio y dale a Run

# 2b) por línea de comandos (necesita Android SDK + Java instalados):
cd android && ./gradlew assembleDebug
# el APK queda en android/app/build/outputs/apk/debug/app-debug.apk
```

Para instalar el `.apk` de depuración en un móvil: actívale "Orígenes
desconocidos" al instalador que uses, o conecta el móvil por USB con la
depuración activada y usa `./gradlew installDebug`.

## Cosas que cambian respecto a jugarlo en el navegador del móvil

- **Orientación**: se bloqueó a horizontal (`sensorLandscape`) en
  `AndroidManifest.xml`, que es como ya está pensado el juego (el aviso de
  "Gira el móvil" del original ya no hace falta).
- **Permisos**: el APK offline no tiene permiso de internet. Se verifica en CI.
- **Cuentas**: nombre y contraseña locales, progreso por cuenta en el WebView,
  sin inicializar Firebase ni comunicarse con el backend original.
- **Sesión**: se recupera al reiniciar. Se guarda también al pasar a segundo plano.
- **Red**: Google, amigos, cooperativo, ranking y actualización web automática
  no están disponibles. Para actualizar se instala un APK nuevo.
- **Datos**: desinstalar o borrar datos los elimina. Las actualizaciones requieren
  el mismo ID y firma para conservarlos; los APK debug actuales pueden cambiar
  de firma entre builds. No hay recuperación por servidor ni migración automática
  desde cuentas de la web. Ver `OFFLINE-ACCOUNTS.md`.

## Licencias (igual que el original, ver `www/assets/pokemon/README.md` y el
## `LICENSE` del repo de JPTER78)

- Código del juego: MIT (JPTER78).
- Iconos/splash de esta app: originales, hechos para este port.
- Sprites de Pokémon: incluidos en el bundle; CC BY-NC 4.0 de SpriteCollab,
  con atribuciones en `www/CREDITS.md` (uso no comercial).
- "Pokémon" y los personajes: marcas de Nintendo/Creatures/GAME FREAK. Este
  port, como el original, es un proyecto de fan sin ánimo de lucro, no
  afiliado ni aprobado por ellos.
