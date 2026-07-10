import { XMLParser, type X2jOptions } from 'fast-xml-parser';

export function createXmlParser(options: X2jOptions): XMLParser {
  return new XMLParser({
    ...options,
    processEntities: {
      enabled: true,
      maxTotalExpansions: 1_000_000,
      maxExpandedLength: 10_000_000,
    },
  });
}
