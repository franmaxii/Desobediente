<script lang="ts">
  /** Link de YouTube: al pegarlo, busca solo la miniatura del video. */
  import { app, vistaDe } from './estado.svelte';
  import { miniaturaYoutube } from './api';
  import { rutaNueva } from './archivos';

  interface Props {
    youtubeId: string;
    miniatura: string;
    error?: string;
  }
  let { youtubeId = $bindable(), miniatura = $bindable(), error = '' }: Props = $props();

  let texto = $state(youtubeId ? `https://youtu.be/${youtubeId}` : '');
  let estado = $state<{ tipo: 'ok' | 'error' | 'cargando'; texto: string } | null>(null);

  function extraerId(t: string): string | undefined {
    const limpio = t.trim();
    const m =
      limpio.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([A-Za-z0-9_-]{11})/) ??
      limpio.match(/^([A-Za-z0-9_-]{11})$/);
    return m?.[1];
  }

  async function cambiar() {
    const id = extraerId(texto);
    if (!id) {
      estado = { tipo: 'error', texto: 'Pegá el link del video (por ejemplo https://youtu.be/…).' };
      return;
    }
    if (id === youtubeId && miniatura) {
      estado = null;
      return;
    }
    estado = { tipo: 'cargando', texto: 'Buscando el video…' };
    try {
      const sha = await miniaturaYoutube(id);
      const ruta = rutaNueva('youtube', id, 'jpg');
      app.subidas[ruta] = { sha, vista: `https://i.ytimg.com/vi/${id}/hqdefault.jpg` };
      youtubeId = id;
      miniatura = ruta;
      texto = `https://youtu.be/${id}`;
      estado = { tipo: 'ok', texto: 'Video encontrado. La miniatura se actualizó.' };
    } catch (e) {
      estado = { tipo: 'error', texto: e instanceof Error ? e.message : 'No se pudo buscar el video.' };
    }
  }
</script>

<div class="campo campo-video" class:con-error={!!error || estado?.tipo === 'error'}>
  <label class="campo">
    <span class="campo-etiqueta">Link del video en YouTube</span>
    <input
      type="url"
      bind:value={texto}
      onchange={cambiar}
      placeholder="https://youtu.be/…"
      spellcheck="false"
      autocomplete="off"
    />
  </label>
  <div class="campo-video-vista">
    {#if miniatura}<img src={vistaDe(miniatura)} alt="" loading="lazy" />{/if}
    {#if estado}
      <span class={estado.tipo === 'error' ? 'campo-error' : 'campo-ayuda'}>{estado.texto}</span>
    {:else if error}
      <span class="campo-error">{error}</span>
    {:else}
      <span class="campo-ayuda">Pegá el link y la miniatura se busca sola.</span>
    {/if}
  </div>
</div>
