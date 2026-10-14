# Esta carpeta va vacía a propósito

El juego original carga aquí ~13.400 sprites (uno por Pokémon y variante:
Idle/Walk/Attack/Shoot/Charge/Hurt/Faint, normal y shiny). Son arte de
[SpriteCollab](https://github.com/PMDCollab/SpriteCollab) (estilo Mundo
Misterioso), con licencia CC BY-NC 4.0, y representan personajes que son
marca y propiedad de Nintendo / Creatures Inc. / GAME FREAK. No vienen
incluidos en este port: no es contenido mío para copiar en bloque dentro de
otro repositorio, con o sin fines de distribución.

El juego funciona igual sin ellos (el motor de sprites de `js/core/sprites.js`
ya tolera imágenes que faltan: reintenta en segundo plano y no rompe nada),
pero las pantallas se ven sin arte de los Pokémon hasta que pongas tú tu
propia copia.

## Cómo rellenarla

Si ya tienes clonado `https://github.com/JPTER78/pokesurvivor` en tu máquina,
desde la raíz de `pokesurvivor-mobile` ejecuta:

```bash
./scripts/import-pokemon-assets.sh /ruta/a/tu/clon/de/pokesurvivor
npx cap sync android
```

Eso copia su carpeta `assets/pokemon/` (misma estructura de subcarpetas:
`assets/pokemon/<id>/<Animación>.png` y `assets/pokemon/<id>/s/<Animación>.png`
para las shiny) dentro de este proyecto y hace que Android la empaquete.

Si no la tienes clonada:

```bash
git clone https://github.com/JPTER78/pokesurvivor.git /tmp/pokesurvivor
./scripts/import-pokemon-assets.sh /tmp/pokesurvivor
```

Recuerda que esos sprites siguen bajo CC BY-NC 4.0 (uso no comercial, con
atribución a SpriteCollab) y que "Pokémon" y los personajes son marcas de
Nintendo/Creatures/GAME FREAK: este port, igual que el original, es un
proyecto de fan sin ánimo de lucro y sin afiliación con ellos.
