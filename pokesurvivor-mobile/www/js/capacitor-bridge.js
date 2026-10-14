/* ============ capacitor-bridge.js ============
 * Pega el juego (tal cual, sin tocar su código) con el contenedor nativo de
 * Android que genera Capacitor. Sólo se activa si corre dentro de la app
 * (window.Capacitor existe); en el navegador normal no hace nada, así que
 * www/ se puede seguir abriendo/depurando como página web normal.
 *
 * - Oculta la splash screen nativa en cuanto el juego terminó de pintar el
 *   primer frame (si no, se queda la nativa tapando el canvas).
 * - Barra de estado: oculta para que el juego (que ya pide pantalla completa
 *   y horizontal) use toda la pantalla.
 * - Botón "atrás" de Android: si hay una partida en curso, abre/cierra el
 *   menú de pausa en vez de cerrar la app de golpe; si estamos en el menú
 *   principal, deja el comportamiento normal (minimizar la app).
 */
(function () {
  if (!window.Capacitor || !window.Capacitor.isNativePlatform || !window.Capacitor.isNativePlatform()) return;
  var Plugins = window.Capacitor.Plugins || {};

  function whenReady(fn) {
    if (document.readyState === 'complete' || document.readyState === 'interactive') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  whenReady(function () {
    // Oculta la barra de estado para jugar en horizontal a pantalla completa.
    try { Plugins.StatusBar && Plugins.StatusBar.hide(); } catch (e) {}

    // Esconde la splash nativa cuando el juego ya está pintando (un par de
    // frames de margen para que no se vea un parpadeo en blanco).
    var hidden = false;
    function hideSplash() {
      if (hidden) return;
      hidden = true;
      try { Plugins.SplashScreen && Plugins.SplashScreen.hide(); } catch (e) {}
    }
    requestAnimationFrame(function () { requestAnimationFrame(hideSplash); });
    setTimeout(hideSplash, 2500); // red de seguridad si algo tarda en cargar

    // Botón físico/gesto "atrás" de Android.
    try {
      Plugins.App && Plugins.App.addListener('backButton', function () {
        var G = window.G;
        if (G && G.Game) {
          if (G.Game.state === 'playing') { G.Game.togglePause(); return; }
          if (G.Game.state === 'paused') { G.Game.togglePause(); return; }
        }
        // En menús/pantallas: si hay algún modal/overlay visible, lo cerramos
        // nosotros; si no hay nada que cerrar, dejamos que Android minimice
        // la app (comportamiento estándar, no forzamos salir del todo).
        var closable = document.querySelector('.scr:not(.hidden) [data-back], .modal:not(.hidden) .close, .overlay:not(.hidden) .close');
        if (closable) { closable.click(); return; }
        Plugins.App.minimizeApp && Plugins.App.minimizeApp();
      });
    } catch (e) {}
  });
})();
