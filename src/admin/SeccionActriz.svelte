<script lang="ts">
  import { app, contenido } from './estado.svelte';
  import { mover } from './ordenable';
  import { prepararFoto, rutaNueva } from './archivos';
  import Campo from './Campo.svelte';
  import CampoImagen from './CampoImagen.svelte';
  import Controles from './Controles.svelte';

  let { errores }: { errores: Map<string, string> } = $props();
  const s = $derived(contenido.sitio);
  const e = (clave: string) => errores.get(`sitio.actriz.${clave}`);

  async function sumarDetras(i: number, archivos: FileList | null) {
    const obra = s.actriz.obras[i];
    for (const archivo of [...(archivos ?? [])]) {
      if (obra.detrasDeEscena.length >= 6) break;
      try {
        const blob = await prepararFoto(archivo);
        const ruta = rutaNueva('actriz', archivo.name, 'jpg');
        app.subidas[ruta] = { blob, vista: URL.createObjectURL(blob) };
        obra.detrasDeEscena.push({ imagen: ruta, alt: `Rodaje de «${obra.titulo}»` });
      } catch (err) {
        alert(err instanceof Error ? err.message : 'No se pudo usar esa foto.');
      }
    }
  }

  function nuevaObra() {
    s.actriz.obras.push({
      titulo: '',
      formato: 'Cortometraje',
      genero: 'Drama',
      personaje: '',
      imagen: '',
      imagenAlt: '',
      imagenVertical: true,
      sinopsis: '',
      cita: '',
      equipo: [],
      notaEquipo: '',
      detrasDeEscena: [],
    });
  }
</script>

<section class="editor">
  <header class="editor-cabeza"><h1>Actriz</h1></header>
  <div class="tarjeta">
    <Campo etiqueta="Título de la sección" bind:valor={s.actriz.titulo} max={60} error={e('titulo')} />
  </div>

  {#each s.actriz.obras as obra, i (i)}
    <div class="tarjeta">
      <div class="tarjeta-cabeza">
        <strong>{obra.titulo || 'Obra nueva'}</strong>
        <Controles indice={i} total={s.actriz.obras.length} queEs="obra" alMover={(a, b) => mover(s.actriz.obras, a, b)} alBorrar={() => s.actriz.obras.splice(i, 1)} />
      </div>
      <div class="fila-campos">
        <Campo etiqueta="Título" bind:valor={obra.titulo} max={80} error={e(`obras.${i}.titulo`)} />
        <Campo etiqueta="Formato" bind:valor={obra.formato} max={40} ayuda="Cortometraje, película, serie, obra de teatro…" error={e(`obras.${i}.formato`)} />
        <Campo etiqueta="Género" bind:valor={obra.genero} max={40} error={e(`obras.${i}.genero`)} />
        <Campo etiqueta="Personaje (opcional)" bind:valor={obra.personaje} max={60} ayuda="Si lo completás, dice «Protagonista · Como …»." error={e(`obras.${i}.personaje`)} />
      </div>
      <div class="fila-campos fila-campos-medios">
        <CampoImagen
          etiqueta="Afiche o foto principal"
          bind:ruta={obra.imagen}
          carpeta="actriz"
          forma={obra.imagenVertical ? 'vertical' : 'horizontal'}
          error={e(`obras.${i}.imagen`)}
        />
        <div>
          <label class="campo campo-check">
            <input type="checkbox" bind:checked={obra.imagenVertical} />
            <span>Es un afiche vertical</span>
          </label>
          <Campo etiqueta="Qué se ve en la imagen" tipo="parrafo" filas={3} bind:valor={obra.imagenAlt} max={300} error={e(`obras.${i}.imagenAlt`)} />
        </div>
      </div>
      <Campo etiqueta="De qué trata" tipo="parrafo" bind:valor={obra.sinopsis} max={800} error={e(`obras.${i}.sinopsis`)} />
      <Campo etiqueta="Una frase de ella sobre el proyecto (opcional)" bind:valor={obra.cita} max={300} error={e(`obras.${i}.cita`)} />

      <h3 class="subtitulo-chico">Equipo</h3>
      {#each obra.equipo as persona, j (j)}
        <div class="fila-campos fila-con-controles">
          <Campo etiqueta="Rol" bind:valor={persona.rol} max={60} error={e(`obras.${i}.equipo.${j}.rol`)} />
          <Campo etiqueta="Instagram (sin @)" bind:valor={persona.instagram} max={30} error={e(`obras.${i}.equipo.${j}.instagram`)} />
          <Controles indice={j} total={obra.equipo.length} queEs="persona" alMover={(a, b) => mover(obra.equipo, a, b)} alBorrar={() => obra.equipo.splice(j, 1)} />
        </div>
      {/each}
      <button type="button" class="boton" onclick={() => obra.equipo.push({ rol: '', instagram: '' })}>+ Agregar persona</button>
      <Campo etiqueta="Nota sobre el equipo (opcional)" bind:valor={obra.notaEquipo} max={160} error={e(`obras.${i}.notaEquipo`)} />

      <h3 class="subtitulo-chico">Detrás de escena (hasta 6 fotos)</h3>
      <div class="mini-grilla">
        {#each obra.detrasDeEscena as foto, j (foto.imagen)}
          <div class="mini-item">
            <CampoImagen etiqueta={`Foto ${j + 1}`} bind:ruta={foto.imagen} carpeta="actriz" error={e(`obras.${i}.detrasDeEscena.${j}.imagen`)} />
            <Campo etiqueta="Qué se ve" bind:valor={foto.alt} max={200} error={e(`obras.${i}.detrasDeEscena.${j}.alt`)} />
            <button type="button" class="boton boton-peligro" onclick={() => obra.detrasDeEscena.splice(j, 1)}>Sacar</button>
          </div>
        {/each}
      </div>
      {#if obra.detrasDeEscena.length < 6}
        <label class="boton">
          + Sumar fotos de detrás de escena
          <input type="file" accept="image/*" multiple hidden onchange={(ev) => { sumarDetras(i, ev.currentTarget.files); ev.currentTarget.value = ''; }} />
        </label>
      {/if}
    </div>
  {/each}

  <button type="button" class="boton" onclick={nuevaObra}>+ Agregar obra</button>
</section>
