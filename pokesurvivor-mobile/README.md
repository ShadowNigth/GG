# PokeSurvivor — port nativo a Android

Port a Android (vía [Capacitor](https://capacitorjs.com/)) del juego web
**PokéSurvivor** ([JPTER78/pokesurvivor](https://github.com/JPTER78/pokesurvivor)):
mismo motor y mismo código de juego (MIT), empaquetado como app nativa en vez
de página web.

Lee **[PORT-NOTES.md](./PORT-NOTES.md)** antes de nada: explica qué se portó
tal cual, qué se dejó fuera a propósito (los sprites de Pokémon, con licencia
de terceros) y cómo completarlo y compilarlo.

## Arranque rápido

```bash
npm install
./scripts/import-pokemon-assets.sh /ruta/a/tu/clon/de/pokesurvivor   # ver abajo
npx cap sync android
npx cap open android      # Android Studio: Run ▶
```

`import-pokemon-assets.sh` copia tu copia local de `assets/pokemon/` (sprites
de personajes Pokémon, no incluidos en este repo por ser contenido de
terceros): ver `www/assets/pokemon/README.md`.

## Vista previa en navegador (sin Android Studio)

`www/` es una página web normal: para probar el juego tal cual queda
empaquetado, sin instalar nada de Android, basta con:

```bash
cd www && python3 -m http.server 8080
```

y abrir `http://localhost:8080/` (usa el joystick táctil o el ratón). El
`capacitor-bridge.js` sólo actúa dentro de la app nativa; en el navegador no
hace nada.

## Estructura

```
pokesurvivor-mobile/
├─ www/                  # el juego (motor MIT portado tal cual + bridge nativo)
├─ android/              # proyecto nativo generado por Capacitor
├─ scripts/
│  └─ import-pokemon-assets.sh
├─ design-src/           # arte original del icono (no se sube al APK)
├─ capacitor.config.json
├─ PORT-NOTES.md
└─ package.json
```
