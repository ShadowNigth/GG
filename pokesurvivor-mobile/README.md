# PokeSurvivor — port nativo a Android

Port a Android (vía [Capacitor](https://capacitorjs.com/)) del juego web
**PokéSurvivor** ([JPTER78/pokesurvivor](https://github.com/JPTER78/pokesurvivor)):
Motor de juego MIT empaquetado como app nativa, ahora con **cuentas offline**
y progreso guardado en el dispositivo, sin internet ni servidores.

Lee **[PORT-NOTES.md](./PORT-NOTES.md)** antes de nada: explica qué se portó
tal cual, los assets de terceros incluidos y cómo compilarlo.

## Cuentas offline

Pulsa **Crear cuenta offline** y elige nombre y contraseña. La app recuerda la
última sesión y guarda el progreso por cuenta en su almacenamiento privado.
No hay Google, ranking ni cooperativo online. Las cuentas de la web original
son independientes y no se importan automáticamente.

**Desinstalar la app o borrar sus datos elimina el progreso.** Los datos no se
escriben dentro del APK. Consulta [OFFLINE-ACCOUNTS.md](./OFFLINE-ACCOUNTS.md)
para conocer los límites, las actualizaciones y las pruebas.

## Arranque rápido

```bash
npm install
npm run build:web
npm test
npm run sync
npx cap open android      # Android Studio: Run ▶
```

`npm install` / `npm ci` extraen automáticamente los **13.468 sprites**
del bundle local `vendor/pokemon.tar.gz` a `www/assets/pokemon/`.
No necesitas clonar el proyecto original. Para restaurarlos sin instalar
dependencias: `npm run assets:prepare` (requiere Node.js y `tar` en el PATH).
`npm run sync` también los restaura antes de sincronizar Android.

Se copiaron también los créditos, la licencia y `assets/og-image.jpg`.
Las fuentes ya eran idénticas. Los iconos originales están en
`www/assets/upstream-icons/`; se conservan los iconos propios del port como
iconos activos. Ver [procedencia y licencias](./vendor/README.md).

## Vista previa en navegador (sin Android Studio)

`www/` es una página web normal: para probar el juego tal cual queda
empaquetado, sin instalar nada de Android, basta con:

```bash
npm run assets:prepare
cd www && python3 -m http.server 8080 --bind 0.0.0.0
```

y abrir `http://localhost:8080/` (usa el joystick táctil o el ratón). El
`capacitor-bridge.js` sólo actúa dentro de la app nativa; en el navegador no
hace nada.

## Estructura

```
pokesurvivor-mobile/
├─ www/                  # el juego (motor MIT portado tal cual + bridge nativo)
├─ android/              # proyecto nativo generado por Capacitor
├─ vendor/               # bundle de sprites + procedencia y checksum
├─ scripts/
│  └─ import-pokemon-assets.sh
├─ design-src/           # arte original del icono (no se sube al APK)
├─ capacitor.config.json
├─ PORT-NOTES.md
└─ package.json
```
