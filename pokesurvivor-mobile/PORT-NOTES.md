# Notas del port a Android (PokeSurvivor)

Port nativo para Android, hecho con [Capacitor](https://capacitorjs.com/),
del juego web **PokéSurvivor** ([JPTER78/pokesurvivor](https://github.com/JPTER78/pokesurvivor)).
Capacitor envuelve el juego (que ya es 100% HTML/CSS/JS, un solo `<canvas>`)
en una WebView dentro de una app Android real: mismo motor, mismo código de
juego, pantalla completa, sin barra de navegador, ícono propio en el launcher,
splash screen, y el botón "atrás" de Android mapeado al menú de pausa en vez
de cerrar la app de golpe.

## Qué se portó tal cual (motor y lógica del juego)

Todo lo que en el proyecto original está bajo licencia MIT (`js/`, `css/`,
`index.html`, `tools/`): cámara, físicas, IA de enemigos, oleadas, subida de
nivel, gacha, logros, misiones, clima, grietas/legendarios, HUD, menús,
ajustes, cooperativo online, ranking y cuentas (Firebase). No se tocó la
lógica de juego, sólo la capa de arranque/empaquetado para Android.

- `www/` = el sitio del juego, copiado del original (motor completo).
- `www/js/capacitor-bridge.js` = lo único añadido: conecta el juego con los
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

## Qué NO se copió (y por qué)

**`assets/pokemon/` (~103 MB, ~13.400 imágenes).** Son sprites de
[SpriteCollab](https://github.com/PMDCollab/SpriteCollab) bajo CC BY-NC 4.0,
y representan personajes que son marca de Nintendo/Creatures/GAME FREAK. No
es código mío ni tuyo: es un recurso de terceros con su propia licencia, así
que no lo dupliqué en bloque dentro de este port. El motor de sprites ya
tolera que falten (no rompe nada, sólo no dibuja esa animación), y dejé
`scripts/import-pokemon-assets.sh` para que lo completes tú copiando tu
propia copia local del repo original — ver `www/assets/pokemon/README.md`.

**Iconos de la app (launcher, splash, favicon).** Los del proyecto original
usan una Poké Ball (también marca registrada). Se generaron iconos 100%
nuevos y originales (un rayo pixel-art) para esta app, en
`www/assets/icons/` y `android/.../res/mipmap-*`. Cámbialos si quieres otro
estilo; el original está en `design-src/icon-master.png`.

**Meta-datos SEO/Open Graph/structured data** del `<head>` original (apuntaban
a `pokesurvivor.com`, imagen `og-image.jpg`, etc.): no aplican dentro de una
app nativa, así que se quitaron del `index.html` portado.

## Cómo compilarla (necesitas Android Studio/SDK — no se puede compilar un
## APK en este entorno porque no tiene SDK de Android ni acceso de red a
## Google/Gradle)

```bash
cd pokesurvivor-mobile
npm install                 # instala Capacitor (ya hecho en este repo)
# 1) pon tus sprites (ver www/assets/pokemon/README.md):
./scripts/import-pokemon-assets.sh /ruta/a/tu/clon/de/pokesurvivor
npx cap sync android

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
- **Permisos**: sólo `INTERNET` (para Firebase/cooperativo/ranking); el juego
  no pide cámara, ubicación ni nada más.
- **Entrar con Google** (`signInWithPopup` en `js/core/db.js`): dentro de una
  WebView embebida, Google suele bloquear este flujo
  ("disallowed_useragent"). Entrar con usuario+contraseña (la opción
  "invitado"/cuenta normal del juego) funciona igual que en el navegador. Si
  quieres arreglar también el login con Google dentro de la app, hace falta
  el plugin `@capacitor-firebase/authentication` (usa Custom Tabs/flujo
  nativo) y que el dueño del proyecto Firebase (`pokesurvivor-free`) registre
  la huella SHA-1 de tu build en la consola de Firebase; no es algo que yo
  pueda hacer por ti porque no es mi proyecto de Firebase.
- **Backend en vivo**: el juego sigue hablando con los servicios reales del
  proyecto original (`pokesurvivor-free` en Firebase, `turn.pokesurvivor.com`
  en Cloudflare) — es el mismo backend que usa la web, no uno mío ni tuyo.
  Para uso personal no debería ser un problema, pero ten en cuenta que
  ranking/cooperativo dependen de que ese servicio siga disponible y acepte
  tráfico desde la app.

## Licencias (igual que el original, ver `www/assets/pokemon/README.md` y el
## `LICENSE` del repo de JPTER78)

- Código del juego: MIT (JPTER78).
- Iconos/splash de esta app: originales, hechos para este port.
- Sprites de Pokémon: no incluidos aquí; CC BY-NC 4.0 de SpriteCollab si los
  añades tú.
- "Pokémon" y los personajes: marcas de Nintendo/Creatures/GAME FREAK. Este
  port, como el original, es un proyecto de fan sin ánimo de lucro, no
  afiliado ni aprobado por ellos.
