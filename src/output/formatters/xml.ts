import { XMLBuilder } from "fast-xml-parser";
import type { OutputWrapper, Formatter, FormatterOptions } from "../types.ts";

export class XmlFormatter implements Formatter {
  private builder: XMLBuilder;

  constructor() {
    this.builder = new XMLBuilder({
      ignoreAttributes: false,
      format: true,
      indentBy: "  ",
    });
  }

  format<T>(data: OutputWrapper<T>, _options?: FormatterOptions): string {
    const xmlContent = this.builder.build({ response: data });
    return `<?xml version="1.0" encoding="UTF-8"?>\n${xmlContent}`;
  }
}
