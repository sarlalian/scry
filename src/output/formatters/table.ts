import Table from "cli-table3";
import chalk from "chalk";
import type { OutputWrapper, Formatter, FormatterOptions } from "../types.ts";

export interface TableColumn {
  key: string;
  header: string;
  width?: number;
  formatter?: (value: unknown) => string;
}

export class TableFormatter implements Formatter {
  constructor(private columns?: TableColumn[]) {}

  format<T>(data: OutputWrapper<T>, options?: FormatterOptions): string {
    if (data.error) {
      return chalk.red(`Error: ${data.error.message}`);
    }

    const items = Array.isArray(data.data) ? data.data : [data.data];
    if (items.length === 0) {
      return chalk.dim("No results found.");
    }

    const columns = this.resolveColumns(items[0], options?.columns);
    const useColors = options?.colors !== false;

    const table = new Table({
      head: columns.map((col) => (useColors ? chalk.cyan.bold(col.header) : col.header)),
      colWidths: columns.map((col) => col.width ?? null),
      style: {
        head: [],
        border: useColors ? ["gray"] : [],
      },
    });

    for (const item of items) {
      const row = columns.map((col) => {
        const value = this.getValue(item as Record<string, unknown>, col.key);
        if (col.formatter) {
          return col.formatter(value);
        }
        return this.formatValue(value);
      });
      table.push(row);
    }

    return table.toString();
  }

  private resolveColumns(sample: unknown, requestedColumns?: string[]): TableColumn[] {
    if (this.columns) {
      if (requestedColumns) {
        return this.columns.filter((col) => requestedColumns.includes(col.key));
      }
      return this.columns;
    }

    if (typeof sample !== "object" || sample === null) {
      return [{ key: "value", header: "Value" }];
    }

    const keys = Object.keys(sample);
    const filtered = requestedColumns ? keys.filter((k) => requestedColumns.includes(k)) : keys;

    return filtered.map((key) => ({
      key,
      header: this.formatHeader(key),
    }));
  }

  private formatHeader(key: string): string {
    return key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (s) => s.toUpperCase())
      .trim();
  }

  private getValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split(".");
    let current: unknown = obj;

    for (const part of parts) {
      if (current === null || current === undefined) {
        return undefined;
      }
      current = (current as Record<string, unknown>)[part];
    }

    return current;
  }

  private formatValue(value: unknown): string {
    if (value === null || value === undefined) {
      return "-";
    }
    if (Array.isArray(value)) {
      return value.join(", ");
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
}
