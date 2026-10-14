# Sprites de Pokémon

Esta carpeta recibe los **13.468 PNG** importados de
[JPTER78/pokesurvivor](https://github.com/JPTER78/pokesurvivor), commit
`b29708900da26b34e70d2dc07ad1659a719f4a78`, sin modificar.

Desde `pokesurvivor-mobile/` ejecuta:

```bash
npm run assets:prepare
npm run assets:verify
npm run sync
```

`npm install` / `npm ci` los extraen automáticamente desde el bundle local
`vendor/pokemon.tar.gz`. No hace falta descargar otro repositorio. Los PNG
extraídos se ignoran en Git; el bundle es la copia persistente y reproducible.
Las rutas originales (`<id>/<Animación>.png` y `<id>/s/<Animación>.png`)
son las que utiliza el motor del juego.

Sprites de [SpriteCollab](https://github.com/PMDCollab/SpriteCollab), bajo
[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) según el
repositorio original: **uso no comercial y con atribución**. Créditos completos
en [CREDITS.md](../../CREDITS.md) y condiciones en [LICENSE](../../LICENSE).
Pokémon y sus personajes son propiedad de Nintendo/Creatures/GAME FREAK/
The Pokémon Company; este port no está afiliado ni aprobado por ellos.
