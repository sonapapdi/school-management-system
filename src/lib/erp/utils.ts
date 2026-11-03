'use client';

import { useEffect, useState } from 'react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** DD MMM YYYY */
export function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  if (isNaN(d.getTime())) return iso;
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** DD MMM, HH:mm */
export function fmtDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]} ${d.getFullYear()}, ${hh}:${mm}`;
}

/** ₹1,24,500 (Indian grouping) */
export function fmtINR(n: number): string {
  const sign = n < 0 ? '-' : '';
  return `${sign}₹${Math.abs(Math.round(n)).toLocaleString('en-IN')}`;
}

export function fmtPct(n: number): string {
  return `${n.toFixed(1)}%`;
}

export function daysBetween(a: string, b: string): number {
  const d1 = new Date(a + 'T00:00:00').getTime();
  const d2 = new Date(b + 'T00:00:00').getTime();
  return Math.round((d2 - d1) / 86400000);
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function weekday(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

export function isWeekday(iso: string): boolean {
  const day = new Date(iso + 'T00:00:00').getDay();
  return day >= 1 && day <= 5;
}

export function monthLabel(month: number, year: number): string {
  return `${MONTHS[month]} ${year}`;
}

export function daysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

let counter = 0;
export function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}${counter.toString(36)}`;
}

export function nowIso(): string {
  return new Date().toISOString();
}

/** Simulated async loading for prototype skeleton states */
export function useFakeLoad(ms = 400): boolean {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), ms);
    return () => clearTimeout(t);
  }, [ms]);
  return loading;
}

/** Deterministic PRNG for seed data */
export function mulberry32(a: number): () => number {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Client-side CSV download for exports */
export function downloadCsv(fileName: string, columns: string[], rows: string[][]): void {
  const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
  const csv = [columns.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadText(fileName: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}
