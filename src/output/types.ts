export interface OutputMeta {
  total?: number;
  maxResults?: number;
  startAt?: number;
  nextPageToken?: string;
  isLast?: boolean;
}

export interface OutputError {
  code: string;
  message: string;
  details?: unknown;
}

export interface OutputWrapper<T> {
  data: T;
  meta?: OutputMeta;
  error?: OutputError;
}

export type OutputFormat = "table" | "plain" | "json" | "xml" | "csv";

export interface FormatterOptions {
  colors?: boolean;
  columns?: string[];
}

export interface Formatter {
  format<T>(data: OutputWrapper<T>, options?: FormatterOptions): string;
}
