<script lang="ts">
  /** Cambiar la canción del reproductor (mp3). Calcula la duración sola. */
  import { app, vistaDe } from './estado.svelte';
  import { duracionDeAudio, rutaNueva } from './archivos';

  interface Props {
    ruta: string;
    duracion: number;
    error?: string;
  }
  let { ruta = $bindable(), duracion = $bindable(), error = '' }: Props = $props();

  let problema = $state('');
  let selector: HTMLInputElement;

  async function elegir(archivos: FileList | null) {
    const archivo = archivos?.[0];
    if (!archivo) return;
    problema = '';
    if (!/\.mp3$/i.test(archivo.name) && archivo.type !== 'audio/mpeg') {
      problema = 'Tiene que ser un archivo .mp3';
      return;
    }
    if (archivo.size > 20 * 1024 * 1024) {
      problema = 'El archivo es muy pesado (máximo 20 MB).';
      return;
    }
    const nueva = rutaNueva('audio', archivo.name, 'mp3');
    app.subidas[nueva] = { blob: archivo, vista: URL.createObjectURL(archivo) };
    ruta = nueva;
    const segundos = await duracionDeAudio(archivo);
    if (segundos) duracion = segundos;
    selector.value = '';
  }

  const minutos = $derived(`${Math.floor(duracion / 60)}:${String(duracion % 60).padStart(2, '0')}`);
</script>

<div class="campo" class:con-error={!!(error || problema)}>
  <span class="campo-etiqueta">Canción (mp3)</span>
  <audio controls preload="none" src={vistaDe(ruta)}></audio>
  <div class="fila-acciones">
    <button type="button" class="boton" onclick={() => selector.click()}>Cambiar canción</button>
    <span class="campo-ayuda">Dura {minutos}. Al cambiarla, la duración se actualiza sola.</span>
  </div>
  {#if problema || error}<span class="campo-error">{problema || error}</span>{/if}
  <input bind:this={selector} type="file" accept=".mp3,audio/mpeg" hidden onchange={(e) => elegir(e.currentTarget.files)} />
</div>
