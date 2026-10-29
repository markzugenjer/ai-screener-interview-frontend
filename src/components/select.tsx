"use client";

import { Check, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/format";

type Opt = { value: string; label: ReactNode; text: string; disabled: boolean };

function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function collect(children: ReactNode): Opt[] {
  const out: Opt[] = [];
  Children.toArray(children).forEach((child) => {
    if (!isValidElement(child)) return;
    const el = child as ReactElement<{ value?: string | number; children?: ReactNode; disabled?: boolean }>;
    if (el.type !== "option") {
      out.push(...collect(el.props.children));
      return;
    }
    const text = textOf(el.props.children);
    out.push({ value: String(el.props.value ?? text), label: el.props.children, text, disabled: !!el.props.disabled });
  });
  return out;
}

const MENU_GAP = 6;
const MENU_MAX = 288; // 18rem

/**
 * Drop-in replacement for <select>, styled to match the app.
 *
 * A hidden native <select> still holds the value, so forms, FormData, `name`, `required`
 * and onChange handlers (including a form's onChange) keep working exactly as before.
 * The visible part follows the ARIA combobox + listbox pattern: arrows, Home/End,
 * Enter/Space, Escape and type-ahead all work, and focus stays on the button.
 */
export function Select({
  className,
  children,
  value,
  defaultValue,
  onChange,
  id,
  disabled,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...rest
}: ComponentProps<"select">) {
  const options = collect(children);
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(() => String(defaultValue ?? options[0]?.value ?? ""));
  const current = controlled ? String(value) : internal;
  const selectedIndex = Math.max(0, options.findIndex((o) => o.value === current));
  const selected = options[selectedIndex];

  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(selectedIndex);
  const [pos, setPos] = useState<CSSProperties & { placement: "top" | "bottom" }>({ placement: "bottom" });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const nativeRef = useRef<HTMLSelectElement>(null);
  const typed = useRef({ text: "", at: 0 });
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optId = (i: number) => `${baseId}-opt-${i}`;
  const [portal, setPortal] = useState<Element | null>(null);

  // Menus render in a portal so tables with overflow and animated (transformed) parents can't clip them.
  useEffect(() => setPortal(buttonRef.current?.closest("dialog") ?? document.body), []);

  const place = useCallback(() => {
    const b = buttonRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    const want = Math.min(MENU_MAX, options.length * 40 + 12);
    const below = window.innerHeight - r.bottom - MENU_GAP - 8;
    const above = r.top - MENU_GAP - 8;
    const top = below < want && above > below;
    const width = Math.max(r.width, 160);
    const left = Math.min(r.left, window.innerWidth - width - 8);
    setPos({
      placement: top ? "top" : "bottom",
      left: Math.max(8, left),
      minWidth: width,
      maxHeight: Math.min(MENU_MAX, Math.max(120, top ? above : below)),
      ...(top ? { bottom: window.innerHeight - r.top + MENU_GAP } : { top: r.bottom + MENU_GAP }),
    });
  }, [options.length]);

  useLayoutEffect(() => {
    if (!open) return;
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!buttonRef.current?.contains(t) && !menuRef.current?.contains(t)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    if (open) document.getElementById(optId(active))?.scrollIntoView({ block: "nearest" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active]);

  function show() {
    if (disabled) return;
    setActive(selectedIndex);
    setOpen(true);
  }

  function choose(i: number) {
    const opt = options[i];
    setOpen(false);
    buttonRef.current?.focus();
    if (!opt || opt.disabled || opt.value === current) return;
    const el = nativeRef.current;
    if (!el) return;
    // Change the real <select> and fire a real, bubbling change event, so React's onChange
    // and any form-level listeners run just as they would for a native select.
    el.value = opt.value;
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function step(from: number, dir: 1 | -1) {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) if (!options[i].disabled) return i;
    return from;
  }

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;
    const k = e.key;
    if (!open) {
      if (k === "ArrowDown" || k === "ArrowUp" || k === "Enter" || k === " ") {
        e.preventDefault();
        show();
      }
      return;
    }
    if (k === "Escape" || k === "Tab") {
      if (k === "Escape") e.preventDefault();
      setOpen(false);
    } else if (k === "ArrowDown" || k === "ArrowUp") {
      e.preventDefault();
      setActive((a) => step(a, k === "ArrowDown" ? 1 : -1));
    } else if (k === "Home" || k === "End") {
      e.preventDefault();
      setActive(k === "Home" ? step(-1, 1) : step(options.length, -1));
    } else if (k === "Enter" || k === " ") {
      e.preventDefault();
      choose(active);
    } else if (k.length === 1 && /\S/.test(k)) {
      const now = e.timeStamp;
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : "") + k.toLowerCase(), at: now };
      const hit = options.findIndex((o) => !o.disabled && o.text.toLowerCase().startsWith(typed.current.text));
      if (hit >= 0) setActive(hit);
    }
  }

  const menu = (
    <AnimatePresence>
      {open && (
        <motion.ul
          ref={menuRef}
          id={listId}
          role="listbox"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          initial={{ opacity: 0, y: pos.placement === "top" ? 4 : -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: pos.placement === "top" ? 4 : -4, scale: 0.98, transition: { duration: 0.12 } }}
          transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
          style={{ position: "fixed", zIndex: 60, transformOrigin: pos.placement === "top" ? "bottom" : "top", ...pos }}
          className="overflow-y-auto overscroll-contain rounded-xl border border-line bg-paper p-1.5 text-[0.9375rem] text-ink shadow-[0_12px_32px_-12px_rgb(29_43_35/0.25),0_2px_6px_rgb(29_43_35/0.06)]"
        >
          {options.map((o, i) => {
            const isSel = i === selectedIndex;
            return (
              <li
                key={`${o.value}-${i}`}
                id={optId(i)}
                role="option"
                aria-selected={isSel}
                aria-disabled={o.disabled || undefined}
                onMouseEnter={() => !o.disabled && setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={cn(
                  "flex cursor-pointer select-none items-center justify-between gap-3 rounded-lg px-3 py-2 transition-colors duration-150",
                  i === active && !o.disabled && "bg-sage-50",
                  isSel ? "font-semibold text-sage-700" : "text-ink",
                  o.disabled && "cursor-not-allowed opacity-45",
                )}
              >
                <span className="truncate">{o.label}</span>
                <Check className={cn("size-4 shrink-0 text-sage-600 transition-opacity", isSel ? "opacity-100" : "opacity-0")} aria-hidden />
              </li>
            );
          })}
        </motion.ul>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <select
        {...rest}
        ref={nativeRef}
        value={current}
        disabled={disabled}
        onChange={(e) => {
          if (!controlled) setInternal(e.target.value);
          onChange?.(e);
        }}
        aria-hidden
        tabIndex={-1}
        className="sr-only"
      >
        {children}
      </select>
      <button
        ref={buttonRef}
        type="button"
        id={id}
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? optId(active) : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={onKeyDown}
        className={cn(
          "group flex h-11 w-full items-center justify-between gap-2 rounded-field border border-line bg-paper px-3.5 text-left text-[0.9375rem] text-ink",
          "transition-[border-color,box-shadow,background-color] duration-200 hover:border-sage-200 hover:bg-sage-50/40",
          "focus:border-sage-500 focus:outline-none focus:ring-4 focus:ring-sage-100",
          open && "border-sage-500 ring-4 ring-sage-100",
          "disabled:cursor-not-allowed disabled:bg-mist disabled:text-ink-faint disabled:hover:border-line",
          className,
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          className={cn("size-4 shrink-0 text-ink-faint transition-transform duration-200", open && "rotate-180 text-sage-600")}
          aria-hidden
        />
      </button>
      {portal && createPortal(menu, portal)}
    </>
  );
}
