export function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export function flattenXmlBlocks(parent: unknown, childKey: string): Record<string, unknown>[] {
  return asArray(parent as Record<string, unknown>).flatMap((block) =>
    asArray((block as Record<string, unknown>)?.[childKey]).filter(
      (item): item is Record<string, unknown> => item != null && typeof item === 'object',
    ),
  );
}

export function looksQualifiedTypeName(name: string | undefined): boolean {
  if (!name) return false;
  return name.includes('.');
}
