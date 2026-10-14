# Assets de PokéSurvivor

Origen: https://github.com/JPTER78/pokesurvivor

Commit importado: `b29708900da26b34e70d2dc07ad1659a719f4a78`.

- `pokemon.tar.gz`: copia íntegra sin modificar de `assets/pokemon/`
  (13.468 PNG, ~80 MiB de contenido, ~54 MiB comprimido).
- `pokemon-source.json`: procedencia, número de archivos y SHA-256 del bundle.
- `../www/CREDITS.md` y `../www/LICENSE`: avisos originales completos.
- `../www/assets/upstream-icons/`: copia de `assets/icons/`, sin sustituir
  los iconos activos del port.
- `../www/assets/og-image.jpg`: imagen del original, sin modificar.
- `../www/assets/fonts/`: ya coincidían byte por byte con las fuentes originales;
  se conserva `OFL.txt`.

Los sprites se conservan en un único bundle versionado para que un clon nuevo
pueda restaurarlos sin red y sin añadir más de 13.000 archivos a Git. El bundle
está fuera de `www/`, de modo que no se duplica dentro del APK.

## Restaurar y comprobar

Desde `pokesurvivor-mobile/`:

```bash
npm run assets:prepare   # Node.js + tar; valida SHA-256 antes de extraer
npm run assets:verify    # comprueba PNG y rutas usadas por sprites-meta.js
npm run sync            # restaura y copia el juego a Android
```

`npm install` y `npm ci` también restauran los sprites mediante `postinstall`.
Si desactivas scripts con `--ignore-scripts`, ejecuta `npm run assets:prepare`
antes de servir `www/` o ejecutar Capacitor directamente. Requisitos: Node.js
y `tar` en el PATH (incluido habitualmente en Linux, macOS y Windows modernos).

La importación manual desde otro clon con `scripts/import-pokemon-assets.sh`
se conserva como alternativa, pero sólo modifica los archivos extraídos:
la siguiente restauración vuelve a aplicar el bundle incluido. Para actualizar
permanentemente el bundle hay que regenerarlo, actualizar su checksum y commit,
copiar los créditos/licencia correspondientes y verificar la compatibilidad con
`www/js/data/sprites-meta.js`.

## Licencias

Según la licencia del repositorio de origen, los sprites de
[SpriteCollab](https://github.com/PMDCollab/SpriteCollab) son
[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/):
**uso no comercial y con atribución**. Se conservan las atribuciones por artista
en `www/CREDITS.md`. No se modificaron las imágenes. Las fuentes están bajo
SIL OFL 1.1. Los assets de terceros no quedan cubiertos por la licencia MIT del
código. No se presupone una licencia adicional para los iconos o la imagen OG.

Pokémon y sus personajes pertenecen a Nintendo, Creatures Inc., GAME FREAK y
The Pokémon Company. Este port no está afiliado ni aprobado por ellos.
