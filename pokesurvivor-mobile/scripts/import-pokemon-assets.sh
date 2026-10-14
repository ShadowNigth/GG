#!/usr/bin/env bash
# Importación opcional desde otro clon local. Para los sprites incluidos:
#   npm run assets:prepare
# Sprites CC BY-NC 4.0; ver www/CREDITS.md y www/LICENSE.
# Este comando sólo cambia la copia de trabajo, no el bundle versionado.
# Uso: ./scripts/import-pokemon-assets.sh /ruta/a/pokesurvivor
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
