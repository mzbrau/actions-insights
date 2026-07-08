import type { ReactNode } from 'react';
import { AppShell } from './layout/AppShell';

/** @deprecated Use AppShell directly */
export function Layout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
