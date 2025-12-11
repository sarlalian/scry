import type { OutputWrapper, Formatter, FormatterOptions } from "../types.ts";

export class PlainFormatter implements Formatter {
  format<T>(data: OutputWrapper<T>, _options?: FormatterOptions): string {
    if (data.error) {
      return `Error: ${data.error.message}`;
    }

    const items = Array.isArray(data.data) ? data.data : [data.data];
    const lines: string[] = [];

    for (const item of items) {
      if (typeof item === "object" && item !== null) {
        lines.push(this.formatObject(item as Record<string, unknown>));
      } else {
        lines.push(String(item));
      }
    }

    return lines.join("\n");
  }

  private formatObject(obj: Record<string, unknown>, indent = 0): string {
    const prefix = "  ".repeat(indent);
    const lines: string[] = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        continue;
      }

      if (typeof value === "object" && !Array.isArray(value)) {
        lines.push(`${prefix}${key}:`);
        lines.push(this.formatObject(value as Record<string, unknown>, indent + 1));
      } else if (Array.isArray(value)) {
        lines.push(`${prefix}${key}: ${value.join(", ")}`);
      } else {
        lines.push(`${prefix}${key}: ${value}`);
      }
    }

    return lines.join("\n");
  }
}
