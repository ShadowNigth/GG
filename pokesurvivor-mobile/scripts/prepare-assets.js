#!/usr/bin/env node
// Restaura el bundle local: no requiere red ni un clon del proyecto original.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
const archive = path.join(root, 'vendor/pokemon.tar.gz');
const manifest = require('../vendor/pokemon-source.json');
const actual = crypto.createHash('sha256').update(fs.readFileSync(archive)).digest('hex');
if (actual !== manifest.sha256) {
  throw new Error('El bundle de sprites está corrupto: restaura vendor/pokemon.tar.gz desde Git.');
}
const dest = path.join(root, 'www/assets');
fs.mkdirSync(dest, { recursive: true });
execFileSync('tar', ['-xzf', archive, '-C', dest], { stdio: 'inherit' });
console.log(`Sprites restaurados (${manifest.files} archivos) en ${dest}/pokemon`);
