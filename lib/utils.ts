import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/* Konvensi shadcn/ui: clsx menggabungkan kelas bersyarat, twMerge membuang yang
   bentrok supaya `className` dari pemanggil selalu menang atas bawaan komponen
   (mis. `p-2` di komponen vs `px-8` yang dioper). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
