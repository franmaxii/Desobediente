<script lang="ts">
  /** Botones para subir, bajar o sacar un elemento de una lista. */
  interface Props {
    indice: number;
    total: number;
    alMover: (desde: number, hasta: number) => void;
    alBorrar: () => void;
    queEs?: string;
  }
  let { indice, total, alMover, alBorrar, queEs = 'elemento' }: Props = $props();
</script>

<div class="controles">
  <button
    type="button"
    class="boton-icono"
    title="Subir"
    aria-label={`Subir ${queEs}`}
    disabled={indice === 0}
    onclick={() => alMover(indice, indice - 1)}>↑</button
  >
  <button
    type="button"
    class="boton-icono"
    title="Bajar"
    aria-label={`Bajar ${queEs}`}
    disabled={indice === total - 1}
    onclick={() => alMover(indice, indice + 1)}>↓</button
  >
  <button
    type="button"
    class="boton-icono peligro"
    title="Sacar"
    aria-label={`Sacar ${queEs}`}
    onclick={() => {
      if (confirm(`¿Sacar este ${queEs}?`)) alBorrar();
    }}>✕</button
  >
</div>
