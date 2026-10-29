import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "cn";
import { GripVertical, ListRestart } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { useLocalize } from "~/lib/localize";

type Dhikr = { text: string; count: number };

/**
 * The whole collection as one-line rows to drag into a new order, like the "Reorder list" screens of
 * Reminders or Beli: the cards themselves are too tall to drag comfortably. Changes apply on Save.
 */
export function AdhkarReorder({
  adhkar,
  order,
  open,
  onOpenChange,
  onSave,
}: {
  adhkar: Dhikr[];
  /** Original indices in the current display order. */
  order: number[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (order: number[]) => void;
}) {
  const { t, num, isAr } = useLocalize();
  const [draft, setDraft] = useState(order);
  // Start each opening from the order on the page.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(order);
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const isOriginal = draft.every((orig, pos) => orig === pos);
  const changed = draft.some((orig, pos) => orig !== order[pos]);

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    setDraft((d) => arrayMove(d, d.indexOf(Number(active.id)), d.indexOf(Number(over.id))));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isAr ? "rtl" : "ltr"}
        closeLabel={t("settings.close")}
        // A bottom sheet on phones, a centred dialog from sm up.
        className="flex max-h-[85dvh] flex-col gap-4 overflow-hidden p-0 max-sm:top-auto max-sm:bottom-0 max-sm:w-full max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-b-none sm:max-w-lg"
      >
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>{t("adhkar.reorder")}</DialogTitle>
          <DialogDescription>{t("adhkar.reorderHint")}</DialogDescription>
        </DialogHeader>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToVerticalAxis, restrictToFirstScrollableAncestor]}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={draft} strategy={verticalListSortingStrategy}>
            <ol className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3">
              {draft.map((i, pos) => (
                <Row
                  key={i}
                  id={i}
                  pos={num(pos + 1)}
                  text={adhkar[i].text}
                  count={adhkar[i].count > 1 ? `×${num(adhkar[i].count)}` : null}
                  grip={t("adhkar.dragHandle")}
                />
              ))}
            </ol>
          </SortableContext>
        </DndContext>

        <div className="flex items-center justify-between gap-2 border-t px-5 py-3">
          <Button
            variant="ghost"
            size="sm"
            disabled={isOriginal}
            onClick={() => setDraft(order.map((_, pos) => pos))}
            className="-ms-2 text-muted-foreground"
          >
            <ListRestart />
            {t("adhkar.resetOrder")}
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              {t("reader.cancel")}
            </Button>
            <Button
              size="sm"
              disabled={!changed}
              onClick={() => {
                onSave(draft);
                onOpenChange(false);
              }}
            >
              {t("reader.saveNote")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({
  id,
  pos,
  text,
  count,
  grip,
}: {
  id: number;
  pos: string;
  text: string;
  count: string | null;
  grip: string;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "relative flex items-center gap-2 rounded-xl py-1 pe-3",
        isDragging ? "z-10 bg-accent shadow-lg ring-1 ring-border" : "bg-background",
      )}
    >
      {/* Only the grip starts a drag, so the list still scrolls under a finger. */}
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={grip}
        className="flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="size-4" />
      </button>
      <span className="w-6 shrink-0 text-center text-xs text-muted-foreground tabular-nums">{pos}</span>
      <span lang="ar" dir="rtl" className="font-adhkar min-w-0 flex-1 truncate text-base">
        {text}
      </span>
      {count && (
        <span dir="ltr" className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-xs text-muted-foreground tabular-nums">
          {count}
        </span>
      )}
    </li>
  );
}
