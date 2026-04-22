import { Signal } from '@angular/core';

export const daysUntil = (date: Signal<string | undefined>) => {
  const eventDate = date;
  if (!eventDate) return null;

  const today = new Date();
  const target = new Date(eventDate()!);
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};
