<script lang="ts">
  /** Muestra una foto del contenido y permite cambiarla por otra. */
  import { app, vistaDe } from './estado.svelte';
  import { prepararFoto, rutaNueva } from './archivos';

  interface Props {
    etiqueta: string;
    ruta: string;
    carpeta: string;
    ayuda?: string;
    forma?: 'vertical' | 'cuadrada' | 'horizontal';
    error?: string;
  }

  let { etiqueta, ruta = $bindable(), carpeta, ayuda = '', forma = 'horizontal', error = '' }: Props = $props();

  let procesando = $state(false);
  let problema = $state('');
  let selector: HTMLInputElement;

  async function elegir(archivos: FileList | null) {
    const archivo = archivos?.[0];
    if (!archivo) return;
    procesando = true;
    problema = '';
    try {
      const blob = await prepararFoto(archivo);
      const nueva = rutaNueva(carpeta, archivo.name, 'jpg');
      app.subidas[nueva] = { blob, vista: URL.createObjectURL(blob) };
      ruta = nueva;
    } catch (e) {
      problema = e instanceof Error ? e.message : 'No se pudo usar esa foto.';
    } finally {
      procesando = false;
      selector.value = '';
    }
  }
</script>

<div class="campo campo-imagen" class:con-error={!!(error || problema)}>
  <span class="campo-etiqueta">{etiqueta}</span>
  <div class="campo-imagen-cuerpo">
    <img class={`vista-${forma}`} src={vistaDe(ruta)} alt="" loading="lazy" />
    <div class="campo-imagen-acciones">
      <button type="button" class="boton" disabled={procesando} onclick={() => selector.click()}>
        {procesando ? 'Procesando…' : 'Cambiar foto'}
      </button>
      {#if ayuda}<span class="campo-ayuda">{ayuda}</span>{/if}
      {#if error || problema}<span class="campo-error">{problema || error}</span>{/if}
    </div>
  </div>
  <input
    bind:this={selector}
    type="file"
    accept="image/*"
    hidden
    onchange={(e) => elegir(e.currentTarget.files)}
  />
</div>
