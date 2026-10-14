#!/usr/bin/env bash
# Copia tu propia copia local de assets/pokemon (sprites de SpriteCollab,
# licencia CC BY-NC, ver www/assets/pokemon/README.md) dentro del proyecto
# Android. No la trae este repo: son ~103 MB de sprites de personajes de
# Pokémon (terceros, no redistribuibles por mí dentro de este port).
#
# Uso:
#   ./scripts/import-pokemon-assets.sh /ruta/a/tu/clon/de/pokesurvivor
#
# Ese "ruta" es la carpeta donde tengas clonado https://github.com/JPTER78/pokesurvivor
# (la que trae la carpeta assets/pokemon con ~13.400 archivos .png).
set -euo pipefail
SRC="${1:-}"
if [ -z "$SRC" ] || [ ! -d "$SRC/assets/pokemon" ]; then
  echo "Uso: $0 /ruta/a/tu/clon/de/pokesurvivor" >&2
  echo "(esa carpeta debe tener dentro assets/pokemon/)" >&2
  exit 1
fi
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="$HERE/www/assets/pokemon"
mkdir -p "$DEST"
echo "Copiando $SRC/assets/pokemon -> $DEST ..."
cp -r "$SRC/assets/pokemon/." "$DEST/"
echo "Listo. Ahora:"
echo "  cd $HERE && npx cap sync android"
echo "para que Android recoja los sprites nuevos."
