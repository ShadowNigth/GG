#!/usr/bin/env node
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../www');
const context = { G: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data/sprites-meta.js'), 'utf8'), context);
let checked = 0;
for (const [dex, meta] of Object.entries(context.G.SPRITE_META)) {
  for (const shiny of meta.sh ? [false, true] : [false]) {
    for (const [anim, normal] of Object.entries(meta.a)) {
      if (shiny && meta.sm?.includes(anim)) continue;
      const geometry = (shiny && meta.sa?.[anim]) || normal;
      const relative = `assets/pokemon/${dex}/${shiny ? 's/' : ''}${anim}.png`;
      const png = fs.readFileSync(path.join(root, relative));
      assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', relative);
      assert.equal(png.readUInt32BE(16), geometry.w * geometry.n, `${relative}: ancho`);
      assert.equal(png.readUInt32BE(20), geometry.h * geometry.r, `${relative}: alto`);
      checked++;
    }
  }
}
console.log(`OK: ${checked} sprites referenciados existen y tienen las dimensiones esperadas.`);
