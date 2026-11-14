<script lang="ts">
  /** Formulario para entrar al panel con usuario y contraseña. */
  import { entrar } from './api';

  let { alEntrar, aviso = '' }: { alEntrar: () => void; aviso?: string } = $props();

  let usuario = $state('desobediente');
  let contrasena = $state('');
  let ver = $state(false);
  let enviando = $state(false);
  let problema = $state('');

  async function enviar(e: SubmitEvent) {
    e.preventDefault();
    if (!contrasena) {
      problema = 'Escribí la contraseña.';
      return;
    }
    enviando = true;
    problema = '';
    try {
      await entrar(usuario, contrasena);
      contrasena = '';
      alEntrar();
    } catch (err) {
      problema = err instanceof Error ? err.message : 'No se pudo entrar.';
    } finally {
      enviando = false;
    }
  }
</script>

<form class="ingresar" onsubmit={enviar}>
  <p class="logo-grande">desobediente</p>
  <p class="ingresar-sub">Panel para editar la página</p>
  {#if aviso}<p class="aviso aviso-info">{aviso}</p>{/if}

  <label class="campo">
    <span class="campo-etiqueta">Usuario</span>
    <input type="text" bind:value={usuario} autocomplete="username" autocapitalize="none" spellcheck="false" required />
  </label>
  <label class="campo">
    <span class="campo-etiqueta">Contraseña</span>
    <span class="ingresar-clave">
      <input
        type={ver ? 'text' : 'password'}
        bind:value={contrasena}
        autocomplete="current-password"
        autocapitalize="none"
        spellcheck="false"
        required
      />
      <button type="button" class="boton boton-texto" onclick={() => (ver = !ver)}>{ver ? 'Ocultar' : 'Ver'}</button>
    </span>
  </label>

  {#if problema}<p class="campo-error">{problema}</p>{/if}

  <button type="submit" class="boton boton-primario ingresar-boton" disabled={enviando}>
    {enviando ? 'Entrando…' : 'Entrar'}
  </button>
</form>
