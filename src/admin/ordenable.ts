/**
 * Acción de Svelte para ordenar arrastrando (con mouse o con el dedo).
 * SortableJS mueve el elemento en pantalla; acá se deshace ese movimiento y se avisa
 * el cambio de orden, así Svelte vuelve a dibujar la lista desde los datos.
 */
import Sortable from 'sortablejs';

interface Opciones {
  alMover: (desde: number, hasta: number) => void;
  manija?: string;
  /** Selector de los elementos que se pueden arrastrar (el resto queda quieto). */
  elementos?: string;
}

export function ordenable(nodo: HTMLElement, opciones: Opciones) {
  let actuales = opciones;
  const sortable = Sortable.create(nodo, {
    animation: 180,
    // mismo comportamiento con mouse y con el dedo (el arrastre nativo varía entre navegadores)
    forceFallback: true,
    fallbackTolerance: 4,
    delay: 160,
    delayOnTouchOnly: true,
    handle: opciones.manija,
    draggable: opciones.elementos ?? '>*',
    ghostClass: 'ordenando-fantasma',
    chosenClass: 'ordenando-elegido',
    onEnd(evento) {
      const { oldIndex, item, from } = evento;
      const desde = evento.oldDraggableIndex;
      const hasta = evento.newDraggableIndex;
      if (oldIndex == null || desde == null || hasta == null || desde === hasta) return;
      from.removeChild(item);
      from.insertBefore(item, from.children[oldIndex] ?? null);
      actuales.alMover(desde, hasta);
    },
  });
  return {
    update(nuevas: Opciones) {
      actuales = nuevas;
    },
    destroy() {
      sortable.destroy();
    },
  };
}

export function mover<T>(lista: T[], desde: number, hasta: number) {
  const [x] = lista.splice(desde, 1);
  lista.splice(hasta, 0, x);
}
