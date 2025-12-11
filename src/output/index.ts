import type { OutputFormat, OutputWrapper, Formatter, FormatterOptions } from "./types.ts";
import { JsonFormatter } from "./formatters/json.ts";
import { XmlFormatter } from "./formatters/xml.ts";
import { PlainFormatter } from "./formatters/plain.ts";
import { TableFormatter } from "./formatters/table.ts";
import { CsvFormatter } from "./formatters/csv.ts";

export type {
  OutputFormat,
  OutputWrapper,
  OutputMeta,
  OutputError,
  FormatterOptions,
} from "./types.ts";
export { TableFormatter } from "./formatters/table.ts";
export type { TableColumn } from "./formatters/table.ts";

export class OutputManager {
  private formatters: Map<OutputFormat, Formatter> = new Map();

  constructor() {
    this.formatters.set("json", new JsonFormatter());
    this.formatters.set("xml", new XmlFormatter());
    this.formatters.set("plain", new PlainFormatter());
    this.formatters.set("table", new TableFormatter());
    this.formatters.set("csv", new CsvFormatter());
  }

  registerFormatter(format: OutputFormat, formatter: Formatter): void {
    this.formatters.set(format, formatter);
  }

  format<T>(
    data: OutputWrapper<T>,
    format: OutputFormat = "table",
    options?: FormatterOptions
  ): string {
    const formatter = this.formatters.get(format);
    if (!formatter) {
      throw new Error(`Unknown output format: ${format}`);
    }
    return formatter.format(data, options);
  }

  print<T>(
    data: OutputWrapper<T>,
    format: OutputFormat = "table",
    options?: FormatterOptions
  ): void {
    const output = this.format(data, format, options);
    console.log(output);
  }
}

let defaultManager: OutputManager | null = null;

export function getOutputManager(): OutputManager {
  if (!defaultManager) {
    defaultManager = new OutputManager();
  }
  return defaultManager;
}

export function output<T>(
  data: T,
  format: OutputFormat = "table",
  options?: FormatterOptions & { meta?: OutputWrapper<T>["meta"] }
): void {
  const wrapper: OutputWrapper<T> = {
    data,
    meta: options?.meta,
  };
  getOutputManager().print(wrapper, format, options);
}

export function outputError(error: Error | string, format: OutputFormat = "table"): void {
  const message = error instanceof Error ? error.message : error;
  const code = error instanceof Error ? error.name : "ERROR";
  const wrapper: OutputWrapper<null> = {
    data: null,
    error: { code, message },
  };
  getOutputManager().print(wrapper, format);
}
