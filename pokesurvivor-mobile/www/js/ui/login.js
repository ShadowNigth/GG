/* ============ login.js — inicio: entrar, crear cuenta o invitado ============ */
G.LoginUI = (() => {
  const $ = G.UI.$;
  let mode = 'login';

  function init() {
    document.querySelectorAll('#scr-login .tab').forEach(t => {
      t.onclick = () => setMode(t.dataset.tab);
    });
    $('login-form').onsubmit = async e => {
      e.preventDefault();
      $('login-err').textContent = '';
      $('btn-auth').disabled = true;
      const fn = mode === 'login' ? G.DB.login : G.DB.register;
      try {
        const r = await fn($('f-user').value, $('f-pass').value);
        if (!r.ok) { $('login-err').textContent = r.error; return; }
        $('f-pass').value = '';
        G.Flow.afterLogin();
      } catch (error) {
        $('login-err').textContent = 'No se pudo abrir la cuenta local. Comprueba el almacenamiento e inténtalo de nuevo.';
      } finally { $('btn-auth').disabled = false; }
    };
    $('btn-guest').onclick = () => { G.DB.playAsGuest(); G.Flow.afterLogin(); };
    $('f-forgot').onclick = e => {
      e.preventDefault();
      $('login-err').textContent = '';
      $('forgot-note').classList.toggle('hidden');
    };
    // Vincular Gmail para poder recuperar la cuenta (ver offerRecovery).
    $('rec-link').onclick = async () => {
      $('rec-err').textContent = '';
      $('rec-link').disabled = true;
      const r = await G.DB.linkGoogle();
      $('rec-link').disabled = false;
      if (!r.ok) { $('rec-err').textContent = r.error; return; }
      $('scr-recover').classList.add('hidden');
      G.UI.toast('¡Gmail vinculado! Si olvidas la contraseña, entra con Google.', 4500);
    };
    $('rec-later').onclick = () => $('scr-recover').classList.add('hidden');
    $('rec-never').onclick = () => {
      try { localStorage.setItem('ps.recover.no.' + G.DB.fb.uid, '1'); } catch (e) { /* nada */ }
      $('scr-recover').classList.add('hidden');
    };
    $('btn-google').onclick = async () => {
      $('login-err').textContent = '';
      $('btn-google').disabled = true;
      const r = await G.DB.loginWithGoogle();
      $('btn-google').disabled = false;
      if (!r.ok) { $('login-err').textContent = r.error; return; }
      G.Flow.afterLogin();
    };
  }

  /**
   * Al entrar (o recién creada la cuenta) con nombre y contraseña, si aún no
   * hay Gmail vinculado: "¿te da miedo perder tu cuenta?". Una vez por sesión,
   * hasta que lo vincule o diga que no le vuelvan a preguntar.
   */
  let offered = false;
  function offerRecovery() {
    if (offered || G.DB.mode !== 'cloud' || !G.DB.fb || !G.DB.nameAccount || G.DB.hasGoogle) return;
    try { if (localStorage.getItem('ps.recover.no.' + G.DB.fb.uid)) return; } catch (e) { /* nada */ }
    offered = true;
    $('rec-err').textContent = '';
    $('scr-recover').classList.remove('hidden');
  }

  /** Explica dónde se guarda la partida según el modo de la base de datos. */
  function modeNote() {
    if (G.OFFLINE) return 'Cuenta offline: tu progreso se guarda sólo en este dispositivo, sin internet ni servidor. Al desinstalar la app o borrar sus datos se pierde. Como invitado no se guarda.';
    if (G.DB.mode === 'cloud') return 'Tu partida se guarda en la nube: entra desde cualquier ordenador. Como invitado no se guarda.';
    const why = G.DB.localReason === 'file'
      ? 'Abierto desde un archivo: la partida sólo se guarda en este navegador. Para guardar en la nube, juega en la versión publicada.'
      : G.DB.localReason === 'config'
        ? 'Nube sin configurar: la partida sólo se guarda en este navegador.'
        : 'No se pudo conectar con la nube: la partida sólo se guarda en este navegador.';
    return why;
  }

  function setMode(m) {
    mode = m;
    $('f-pass').minLength = m === 'register' ? (G.DB.mode === 'cloud' ? 6 : 4) : 0;
    document.querySelectorAll('#scr-login .tab').forEach(t => t.classList.toggle('on', t.dataset.tab === m));
    $('btn-auth').textContent = m === 'login' ? 'Entrar' : (G.OFFLINE ? 'Crear cuenta offline' : 'Crear cuenta');
    $('f-pass').autocomplete = m === 'login' ? 'current-password' : 'new-password';
    $('login-err').textContent = '';
    // Sólo se pregunta si quedan plazas al ir a crear cuenta (cada llamada al Worker cuenta).
    if (m === 'register' && G.DB.mode === 'cloud' && G.Signups) G.Signups.check().then(applySignups);
  }

  /** Tope de cuentas del mes alcanzado: sin "Crear cuenta" hasta el mes siguiente. */
  function applySignups(open) {
    const reg = document.querySelector('#scr-login .tab[data-tab="register"]');
    if (reg) reg.classList.toggle('hidden', !open);
    if (!open && mode === 'register') setMode('login');
    const note = $('signup-closed');
    note.classList.toggle('hidden', open);
    if (!open) note.textContent = 'Este mes se han llenado las plazas de cuentas nuevas: vuelven el 1 de ' + G.Signups.nextMonthName() +
      '. Si ya tienes cuenta, entra normal. Si no, juega como invitado.';
    $('btn-google').textContent = open ? 'Entrar con Google' : 'Entrar con Google (si ya tienes cuenta)';
  }

  function open() {
    G.UI.chrome(false);
    G.UI.show('scr-login');
    // Abiertas: no se pregunta hasta ir a "Crear cuenta". Cerradas (con la pestaña
    // escondida): se vuelve a preguntar (va con caché de 30 min) para reabrir a tiempo.
    if (G.DB.mode === 'cloud' && G.Signups) {
      if (G.Signups.closed) G.Signups.check().then(applySignups); else applySignups(true);
    }
    if (!G.DB.storageOk) $('login-err').textContent = 'No se puede guardar en este dispositivo: comprueba el espacio disponible. Como invitado no se guarda.';
    $('btn-google').classList.toggle('hidden', G.DB.mode !== 'cloud');
    $('login-mode').textContent = modeNote();
    if (G.OFFLINE) {
      $('forgot-note').textContent = 'Esta cuenta existe sólo en este dispositivo. No hay recuperación por correo ni Google: recuerda tu contraseña. Puedes crear otra cuenta, pero tendrá un progreso independiente.';
      $('f-pass').minLength = mode === 'register' ? 4 : 0;
    }
    setMode(mode);
    setTimeout(() => $('f-user').focus(), 50);
  }

  return { init, open, offerRecovery };
})();
