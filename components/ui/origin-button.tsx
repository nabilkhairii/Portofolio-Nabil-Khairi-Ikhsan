'use client';

import type * as React from 'react';
import { cn } from '@/lib/utils';

type OriginButtonProps = {
  text: string;
  en?: string;
} & (
  | ({ href: string } & React.AnchorHTMLAttributes<HTMLAnchorElement>)
  | ({ href?: undefined } & React.ButtonHTMLAttributes<HTMLButtonElement>)
);

function setOrigin(node: HTMLElement, x: number, y: number) {
  // Keep the wave anchored while an interrupted exit reverses.
  if (parseFloat(getComputedStyle(node, '::before').scale) > 0) return;
  const rect = node.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const left = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
  const top = Math.max(0, Math.min(1, (y - rect.top) / rect.height));
  node.style.setProperty('--fill-x', `${left * 100}%`);
  node.style.setProperty('--fill-y', `${top * 100}%`);
  // Percentages keep the coverage proportional when the translated label changes.
  node.style.setProperty('--fill-reach', `${200 * Math.max(left, 1 - left)}%`);
  node.style.setProperty('--fill-rise', `${2 * node.offsetHeight * Math.max(top, 1 - top)}px`);
}

export function OriginButton({ text, en, className, ...props }: OriginButtonProps) {
  const handlers = {
    onPointerEnter(event: React.PointerEvent<HTMLElement>) {
      if (event.pointerType === 'touch') return;
      setOrigin(event.currentTarget, event.clientX, event.clientY);
      event.currentTarget.dataset.pointerInside = '';
    },
    onPointerDown(event: React.PointerEvent<HTMLElement>) {
      if (event.pointerType === 'touch') setOrigin(event.currentTarget, event.clientX, event.clientY);
    },
    onPointerLeave(event: React.PointerEvent<HTMLElement>) {
      delete event.currentTarget.dataset.pointerInside;
    },
    onPointerCancel(event: React.PointerEvent<HTMLElement>) {
      delete event.currentTarget.dataset.pointerInside;
    },
    onFocus(event: React.FocusEvent<HTMLElement>) {
      if (!event.currentTarget.matches(':focus-visible')) return;
      for (const key of ['--fill-x', '--fill-y', '--fill-reach', '--fill-rise']) {
        event.currentTarget.style.removeProperty(key);
      }
    },
  };
  const classes = cn('origin-button relative cursor-pointer touch-manipulation select-none overflow-hidden active:scale-[0.985]', className);
  const label = <span className="relative z-10" data-en={en}>{text}</span>;
  return props.href !== undefined ? (
    <a className={classes} {...handlers} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{label}</a>
  ) : (
    <button className={classes} {...handlers} {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{label}</button>
  );
}
