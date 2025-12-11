import type { OutputWrapper, Formatter, FormatterOptions } from "../types.ts";

export class JsonFormatter implements Formatter {
  format<T>(data: OutputWrapper<T>, _options?: FormatterOptions): string {
    return JSON.stringify(data, null, 2);
  }
}
