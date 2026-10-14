# Cuentas offline (Android 1.1)

## Uso

1. Abre la app, incluso en modo avión, y toca **Crear cuenta offline**.
2. Elige un nombre de 3–16 letras, números o `_`, y una contraseña de al menos
   4 caracteres. No hace falta correo, Google, internet ni servidor.
3. Completa el test inicial y juega. La colección, monedas, mejoras y estadísticas
   se guardan en el dispositivo. El modo invitado sigue sin guardar progreso.
4. Al abrir la app de nuevo se recupera la última sesión. En Ajustes → Cuenta
   puedes cerrar sesión, entrar con otra cuenta local o borrar la cuenta actual
   confirmando su contraseña. Cada cuenta tiene su propio progreso.

## Dónde se guarda

En `localStorage` del WebView de Capacitor, dentro de los datos privados de la
app (`com.pokesurvivorfan.mobile`), **no dentro del archivo APK firmado**:

- `ps.accounts`: nombres, sal y hash derivado de contraseña.
- `ps.save.<nombre en minúsculas>`: progreso de cada cuenta.
- `ps.session`: cuenta con sesión abierta.

Se conservan las claves y el esquema de las cuentas locales antiguas. Las nuevas
contraseñas usan PBKDF2-HMAC-SHA256, 210.000 iteraciones y sal aleatoria; no se
guardan en texto plano. Esto no cifra el progreso ni sustituye el bloqueo del
móvil: alguien con acceso privilegiado a los archivos de la app puede modificarlos.

El guardado del progreso es síncrono. Además se guarda al ocultar la página,
salir de ella o recibir `appStateChange` de Android al pasar a segundo plano.
Esto conserva el progreso de la cuenta; no añade reanudación de una partida de
combate a mitad de una oleada. Si el almacenamiento falla, se muestra un aviso
(en lugar de afirmar que se guardó). La creación falla si no se pueden persistir
la cuenta, la partida inicial o la sesión.

## Sin servicios externos

`G.OFFLINE = true` evita inicializar Firebase incluso si se añadiese por error
una configuración. El port ya no contiene la configuración del backend original.
El APK no tiene permiso `INTERNET` y desactiva las copias automáticas de Android
con `allowBackup=false`. El comprobador de actualizaciones y el registro de
service worker están desactivados en esta edición. Los assets van incluidos.

Google, ranking, amigos y cooperativo online no están disponibles. Las cuentas
online de la web original no se convierten ni se descargan automáticamente;
crear aquí el mismo nombre crea una cuenta independiente. Las copias locales
antiguas de la nube no se borran, pero no se usan para iniciar sesión offline.

## Límites importantes

- Desinstalar la app, borrar sus datos o borrar la cuenta elimina el progreso local.
- No hay recuperación de contraseña por correo ni sincronización entre móviles.
- No hay exportación/importación de copias de seguridad en esta versión.
- Una actualización instalada sobre la anterior con el mismo ID y firma mantiene
  los datos. Las compilaciones actuales son **debug** y su firma puede cambiar
  entre ejecuciones de CI: no desinstales una versión con progreso que quieras
  conservar para resolver una incompatibilidad de firma. Para distribuir futuras
  actualizaciones sin este problema hace falta una clave de firma persistente.
- En la vista previa web se guarda por navegador/origen; no comparte datos con Android.

## Verificación

```bash
npm ci
npm run build:web
npm test
npx playwright install chromium
npm run test:browser
npm run assets:verify
npm run sync
```

Las pruebas de datos cubren creación, validación, contraseña incorrecta,
recuperación de sesión tras reiniciar, aislamiento entre cuentas, invitado,
borrado, fallos de almacenamiento, guardado al pasar a segundo plano y
compatibilidad con cuentas locales antiguas. La prueba de navegador usa la
página **minificada de producción**, bloquea toda conexión externa y cierra y
reabre el navegador con el mismo perfil para verificar la persistencia.
CI repite estas pruebas, compila el APK y comprueba con `aapt` que el APK final
no tenga permiso de internet antes de publicar la descarga en GitHub Releases.
