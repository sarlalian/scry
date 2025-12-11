import type { OutputWrapper, Formatter, FormatterOptions } from "../types.ts";

export class CsvFormatter implements Formatter {
  format<T>(data: OutputWrapper<T>, options?: FormatterOptions): string {
    if (data.error) {
      return `error,${this.escapeField(data.error.message)}`;
    }

    const items = Array.isArray(data.data) ? data.data : [data.data];
    if (items.length === 0) {
      return "";
    }

    const sample = items[0];
    if (typeof sample !== "object" || sample === null) {
      return items.map((item) => this.escapeField(String(item))).join("\n");
    }

    const keys = this.resolveKeys(sample as Record<string, unknown>, options?.columns);
    const lines: string[] = [];

    lines.push(keys.join(","));

    for (const item of items) {
      const row = keys.map((key) => {
        const value = (item as Record<string, unknown>)[key];
        return this.escapeField(this.formatValue(value));
      });
      lines.push(row.join(","));
    }

    return lines.join("\n");
  }

  private resolveKeys(sample: Record<string, unknown>, requestedColumns?: string[]): string[] {
    const keys = Object.keys(sample);
    if (requestedColumns) {
      return keys.filter((k) => requestedColumns.includes(k));
    }
    return keys;
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return "";
    }
    if (Array.isArray(value)) {
      return value.join(";");
    }
    if (typeof value === "object") {
      if ("name" in value && typeof value.name === "string") {
        return value.name;
      }
      if ("displayName" in value && typeof value.displayName === "string") {
        return value.displayName;
      }
      return JSON.stringify(value);
    }
    return String(value);
  }

  private escapeField(value: string): string {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
