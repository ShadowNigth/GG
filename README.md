# GG

## pokesurvivor-mobile

Port a app nativa de Android (con [Capacitor](https://capacitorjs.com/)) del
juego web [JPTER78/pokesurvivor](https://github.com/JPTER78/pokesurvivor).

Ver [`pokesurvivor-mobile/README.md`](./pokesurvivor-mobile/README.md) y
[`pokesurvivor-mobile/PORT-NOTES.md`](./pokesurvivor-mobile/PORT-NOTES.md)
para el detalle de los assets importados, sus licencias y cómo compilarlo.
Los sprites se incluyen en un bundle local y se extraen con `npm install`.

## Descargar el APK

Las compilaciones de Android se publican en
[GitHub Releases](https://github.com/ShadowNigth/GG/releases).
Abre la publicación más reciente y descarga **`pokesurvivor-debug.apk`**
(no los archivos de código fuente). Es una versión de depuración, con los
assets incluidos; no requiere iniciar sesión para descargarla.

Android puede pedir permiso para instalar aplicaciones de esta fuente.
Las compilaciones usan claves de depuración que pueden cambiar; una
actualización con firma diferente requiere desinstalar la anterior, lo que
borra sus datos locales. Los sprites son para uso no comercial y requieren
atribución; consulta los créditos y licencias incluidos en el proyecto.
