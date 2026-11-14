<script lang="ts">
  /** Editor de una galería: ordenar, subir, describir, dar crédito y sacar fotos. */
  import { app, contenido, vistaDe } from './estado.svelte';
  import { descripcionInicial, prepararFoto, rutaNueva, slug } from './archivos';
  import { mover, ordenable } from './ordenable';
  import Campo from './Campo.svelte';

  type GaleriaId = 'modelo' | 'en-vivo';
  interface Props {
    id: GaleriaId;
    errores: Map<string, string>;
  }
  let { id, errores }: Props = $props();

  const NOMBRES: Record<GaleriaId, string> = { modelo: 'Fotos de modelo', 'en-vivo': 'Fotos en vivo' };
  const POR_DEFECTO: Record<GaleriaId, string> = { modelo: 'Sesión de fotos', 'en-vivo': 'Show en vivo' };
  const otra: GaleriaId = $derived(id === 'modelo' ? 'en-vivo' : 'modelo');

  const galeria = $derived(contenido.galerias.galerias[id]);
  const fotografos = $derived(contenido.galerias.fotografos);
  const total = $derived(galeria.fotos.length);
  const faltan = $derived(total % 4 === 0 ? 0 : 4 - (total % 4));

  let procesando = $state({ hechas: 0, total: 0 });
  let problemas = $state<string[]>([]);
  let arrastrandoArchivos = $state(false);
  let deshacer = $state<{ foto: (typeof galeria.fotos)[number]; indice: number } | null>(null);
  let temporizador: ReturnType<typeof setTimeout> | undefined;
  let editando = $state<number | null>(null);
  let dialogo: HTMLDialogElement;
  let selector: HTMLInputElement;
  let ultimoFotografo = $state<string | undefined>(undefined);

  async function agregar(archivos: FileList | File[] | null | undefined) {
    const lista = [...(archivos ?? [])].filter((a) => a.type.startsWith('image/') || /\.(jpe?g|png|webp|heic|avif)$/i.test(a.name));
    if (!lista.length) return;
    problemas = [];
    procesando = { hechas: 0, total: lista.length };
    for (const archivo of lista) {
      try {
        const blob = await prepararFoto(archivo);
        const ruta = rutaNueva(id, archivo.name, 'jpg');
        app.subidas[ruta] = { blob, vista: URL.createObjectURL(blob) };
        galeria.fotos.push({
          imagen: ruta,
          descripcion: descripcionInicial(archivo.name, POR_DEFECTO[id]),
          ...(ultimoFotografo ? { fotografo: ultimoFotografo } : {}),
        });
      } catch (e) {
        problemas.push(e instanceof Error ? e.message : `No se pudo usar «${archivo.name}».`);
      }
      procesando.hechas++;
    }
    procesando = { hechas: 0, total: 0 };
  }

  function sacar(indice: number) {
    const [foto] = galeria.fotos.splice(indice, 1);
    deshacer = { foto, indice };
    clearTimeout(temporizador);
    temporizador = setTimeout(() => (deshacer = null), 10000);
    if (editando !== null) cerrar();
  }

  function restaurar() {
    if (!deshacer) return;
    galeria.fotos.splice(Math.min(deshacer.indice, galeria.fotos.length), 0, deshacer.foto);
    deshacer = null;
  }

  function abrir(i: number) {
    editando = i;
    dialogo.showModal();
  }
  function cerrar() {
    dialogo.close();
  }

  function pasarALaOtra(i: number) {
    const [foto] = galeria.fotos.splice(i, 1);
    contenido.galerias.galerias[otra].fotos.push(foto);
    cerrar();
  }

  // fotógrafos
  let nuevoNombre = $state('');
  let nuevoInstagram = $state('');
  let problemaFotografo = $state('');

  function agregarFotografo() {
    problemaFotografo = '';
    const nombre = nuevoNombre.trim();
    const instagram = nuevoInstagram.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '');
    if (!nombre || !instagram) {
      problemaFotografo = 'Poné el nombre y el usuario de Instagram.';
      return;
    }
    let base = slug(nombre) || 'fotografo';
    let nuevoId = base;
    let n = 2;
    while (fotografos.some((f) => f.id === nuevoId)) nuevoId = `${base}-${n++}`;
    fotografos.push({ id: nuevoId, nombre, instagram });
    nuevoNombre = '';
    nuevoInstagram = '';
  }

  function sacarFotografo(i: number) {
    const f = fotografos[i];
    const usos = Object.values(contenido.galerias.galerias).reduce(
      (n, g) => n + g.fotos.filter((x) => x.fotografo === f.id).length,
      0,
    );
    if (usos && !confirm(`${f.nombre} tiene crédito en ${usos} foto(s). Si lo sacás, esas fotos quedan sin crédito. ¿Seguir?`)) return;
    for (const g of Object.values(contenido.galerias.galerias)) {
      for (const foto of g.fotos) if (foto.fotografo === f.id) delete foto.fotografo;
    }
    fotografos.splice(i, 1);
  }

  const nombreFotografo = (fid?: string) => fotografos.find((f) => f.id === fid)?.nombre;
  const errorDe = (i: number) =>
    errores.get(`galerias.galerias.${id}.fotos.${i}.descripcion`) ?? errores.get(`galerias.galerias.${id}.fotos.${i}.fotografo`);

  const fotoEditada = $derived(editando !== null ? galeria.fotos[editando] : undefined);
</script>

<section class="editor">
  <header class="editor-cabeza">
    <div>
      <h1>{NOMBRES[id]}</h1>
      <p class="editor-sub">
        {total} foto{total === 1 ? '' : 's'}
        {#if total === 0}
          · la sección no se muestra en la página hasta que haya fotos
        {:else if faltan === 0}
          · <span class="ok">la grilla queda completa ✓</span>
        {:else}
          · <span class="atencion">faltan {faltan} para completar la última fila (o sacá {4 - faltan})</span>
        {/if}
      </p>
    </div>
    <button type="button" class="boton boton-primario" onclick={() => selector.click()}>+ Subir fotos</button>
  </header>

  <p class="editor-ayuda">
    Arrastrá las fotos para cambiar el orden (en el celular, mantené apretado un segundo). Tocá una foto para
    cambiarle la descripción o el crédito.
  </p>

  {#if procesando.total}
    <p class="aviso aviso-info">Preparando fotos… {procesando.hechas} de {procesando.total}</p>
  {/if}
  {#each problemas as p}
    <p class="aviso aviso-error">{p}</p>
  {/each}

  <div
    class="grilla-fotos"
    class:recibiendo={arrastrandoArchivos}
    role="list"
    use:ordenable={{ alMover: (a, b) => mover(galeria.fotos, a, b), elementos: '.foto-item' }}
    ondragover={(e) => {
      if (e.dataTransfer?.types.includes('Files')) {
        e.preventDefault();
        arrastrandoArchivos = true;
      }
    }}
    ondragleave={() => (arrastrandoArchivos = false)}
    ondrop={(e) => {
      if (e.dataTransfer?.files.length) {
        e.preventDefault();
        arrastrandoArchivos = false;
        agregar(e.dataTransfer.files);
      }
    }}
  >
    {#each galeria.fotos as foto, i (foto.imagen)}
      <div class="foto-item" class:con-error={!!errorDe(i)} role="listitem">
        <button type="button" class="foto-boton" onclick={() => abrir(i)} aria-label={`Editar foto ${i + 1}: ${foto.descripcion}`}>
          <img src={vistaDe(foto.imagen)} alt="" loading="lazy" draggable="false" />
          <span class="foto-numero">{i + 1}</span>
          {#if app.subidas[foto.imagen]}<span class="foto-nueva">nueva</span>{/if}
          <span class="foto-pie">
            <span class="foto-descripcion">{foto.descripcion || 'Sin descripción'}</span>
            {#if foto.fotografo}<span class="foto-credito">Ph: {nombreFotografo(foto.fotografo)}</span>{/if}
          </span>
        </button>
        <button type="button" class="foto-sacar" aria-label={`Sacar foto ${i + 1}`} title="Sacar foto" onclick={() => sacar(i)}>✕</button>
      </div>
    {/each}
    {#each { length: faltan } as _}
      <button type="button" class="foto-hueco" onclick={() => selector.click()} aria-label="Subir foto para completar la fila">
        <span>+</span>
      </button>
    {/each}
    {#if total === 0}
      <button type="button" class="foto-hueco foto-hueco-grande" onclick={() => selector.click()}>
        <span>+</span> Subí las primeras fotos
      </button>
    {/if}
  </div>

  {#if deshacer}
    <div class="deshacer" role="status">
      Sacaste una foto.
      <button type="button" class="boton" onclick={restaurar}>Deshacer</button>
    </div>
  {/if}

  <details class="plegable">
    <summary>Textos de esta sección</summary>
    <div class="plegable-cuerpo">
      <Campo etiqueta="Encabezado chico (arriba del título)" bind:valor={galeria.eyebrow} max={40} error={errores.get(`galerias.galerias.${id}.eyebrow`)} />
      <Campo etiqueta="Título" bind:valor={galeria.titulo} max={60} error={errores.get(`galerias.galerias.${id}.titulo`)} />
      <Campo etiqueta="Texto del botón (lleva a Instagram)" bind:valor={galeria.cta} max={60} error={errores.get(`galerias.galerias.${id}.cta`)} />
    </div>
  </details>

  <details class="plegable">
    <summary>Fotógrafos ({fotografos.length})</summary>
    <div class="plegable-cuerpo">
      <p class="editor-ayuda">El crédito aparece debajo de la galería y al ampliar cada foto, con link a su Instagram.</p>
      <ul class="lista-simple">
        {#each fotografos as f, i (f.id)}
          <li>
            <span><strong>{f.nombre}</strong> · @{f.instagram}</span>
            <button type="button" class="boton-icono peligro" aria-label={`Sacar a ${f.nombre}`} onclick={() => sacarFotografo(i)}>✕</button>
          </li>
        {/each}
      </ul>
      <div class="fila-campos">
        <Campo etiqueta="Nombre" bind:valor={nuevoNombre} placeholder="Ej.: Ivo Barrios" />
        <Campo etiqueta="Instagram" bind:valor={nuevoInstagram} placeholder="usuario, sin @" />
        <button type="button" class="boton" onclick={agregarFotografo}>Agregar</button>
      </div>
      {#if problemaFotografo}<p class="campo-error">{problemaFotografo}</p>{/if}
    </div>
  </details>

  <input bind:this={selector} type="file" accept="image/*" multiple hidden onchange={(e) => { agregar(e.currentTarget.files); e.currentTarget.value = ''; }} />
</section>

<dialog bind:this={dialogo} class="modal modal-foto" onclose={() => (editando = null)}>
  {#if fotoEditada && editando !== null}
    {@const i = editando}
    <div class="modal-foto-cuerpo">
      <img class="modal-foto-vista" src={vistaDe(fotoEditada.imagen)} alt="" />
      <div class="modal-foto-campos">
        <p class="modal-contador">Foto {i + 1} de {total}</p>
        <Campo
          etiqueta="Descripción"
          tipo="parrafo"
          filas={3}
          bind:valor={fotoEditada.descripcion}
          max={160}
          ayuda="Qué se ve en la foto, en pocas palabras. La usan Google y las personas que navegan con lector de pantalla."
          error={errores.get(`galerias.galerias.${id}.fotos.${i}.descripcion`)}
        />
        <label class="campo">
          <span class="campo-etiqueta">Crédito</span>
          <select
            value={fotoEditada.fotografo ?? ''}
            onchange={(e) => {
              const v = e.currentTarget.value;
              if (v) {
                fotoEditada.fotografo = v;
                ultimoFotografo = v;
              } else delete fotoEditada.fotografo;
            }}
          >
            <option value="">Sin crédito</option>
            {#each fotografos as f (f.id)}<option value={f.id}>{f.nombre}</option>{/each}
          </select>
          <span class="campo-ayuda">Para sumar otro fotógrafo, usá «Fotógrafos» abajo de la galería.</span>
        </label>
        <div class="modal-acciones-secundarias">
          <button type="button" class="boton" disabled={i === 0} onclick={() => (editando = i - 1)}>← Anterior</button>
          <button type="button" class="boton" disabled={i === total - 1} onclick={() => (editando = i + 1)}>Siguiente →</button>
        </div>
        <div class="modal-acciones-secundarias">
          <button type="button" class="boton" onclick={() => pasarALaOtra(i)}>Pasar a «{NOMBRES[otra]}»</button>
          <button type="button" class="boton boton-peligro" onclick={() => sacar(i)}>Sacar foto</button>
        </div>
        <button type="button" class="boton boton-primario modal-listo" onclick={cerrar}>Listo</button>
      </div>
    </div>
  {/if}
</dialog>
