// Positions in a book's typed-out text, kept as block index + character offset (the texts are fixed),
// and their DOM counterparts. Shared by notes (passages) and the bookmark (a line).

import type { TextPoint } from "./book-notes";

/** The text block (`data-block`) a node sits in. */
export function blockOf(node: Node): HTMLElement | null {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return el?.closest<HTMLElement>("[data-block]") ?? null;
}

/** Characters from the start of `block` to (node, offset). */
export function offsetIn(block: HTMLElement, node: Node, offset: number) {
  const r = document.createRange();
  r.setStart(block, 0);
  r.setEnd(node, offset);
  return r.toString().length;
}

/** The DOM position of a text point. */
export function domPoint(article: HTMLElement, p: TextPoint): [Node, number] | null {
  const block = article.querySelector(`[data-block="${p.b}"]`);
  if (!block) return null;
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let left = p.o;
  let last: Node | null = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const len = n.textContent?.length ?? 0;
    if (left <= len) return [n, left];
    left -= len;
    last = n;
  }
  return last ? [last, last.textContent?.length ?? 0] : [block, 0];
}

/** The text position under a point on screen, across browsers. */
export function caretAt(x: number, y: number): [Node, number] | null {
  const doc = document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null };
  const pos = doc.caretPositionFromPoint?.(x, y);
  if (pos) return [pos.offsetNode, pos.offset];
  const r = doc.caretRangeFromPoint?.(x, y);
  return r ? [r.startContainer, r.startOffset] : null;
}
