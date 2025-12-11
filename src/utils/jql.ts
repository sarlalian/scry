type OrderDirection = "ASC" | "DESC";

interface JqlCondition {
  field: string;
  operator: string;
  value: string | string[];
}

export class JqlBuilder {
  private conditions: JqlCondition[] = [];
  private orderByField: string | null = null;
  private orderDirection: OrderDirection = "DESC";

  project(key: string): this {
    this.addCondition("project", "=", key);
    return this;
  }

  assignee(user: string): this {
    if (user === "x" || user === "unassigned") {
      this.conditions.push({ field: "assignee", operator: "IS", value: "EMPTY" });
    } else {
      this.addCondition("assignee", "=", user);
    }
    return this;
  }

  reporter(user: string): this {
    this.addCondition("reporter", "=", user);
    return this;
  }

  status(value: string): this {
    if (value.startsWith("~")) {
      this.addCondition("status", "!=", value.slice(1));
    } else {
      this.addCondition("status", "=", value);
    }
    return this;
  }

  statusIn(values: string[]): this {
    this.conditions.push({ field: "status", operator: "IN", value: values });
    return this;
  }

  statusNotIn(values: string[]): this {
    this.conditions.push({ field: "status", operator: "NOT IN", value: values });
    return this;
  }

  type(value: string): this {
    if (value.startsWith("~")) {
      this.addCondition("issuetype", "!=", value.slice(1));
    } else {
      this.addCondition("issuetype", "=", value);
    }
    return this;
  }

  priority(value: string): this {
    if (value.startsWith("~")) {
      this.addCondition("priority", "!=", value.slice(1));
    } else {
      this.addCondition("priority", "=", value);
    }
    return this;
  }

  label(value: string): this {
    if (value.startsWith("~")) {
      this.conditions.push({
        field: "labels",
        operator: "NOT IN",
        value: [value.slice(1)],
      });
    } else {
      this.conditions.push({ field: "labels", operator: "IN", value: [value] });
    }
    return this;
  }

  labels(values: string[]): this {
    const include = values.filter((v) => !v.startsWith("~"));
    const exclude = values.filter((v) => v.startsWith("~")).map((v) => v.slice(1));

    if (include.length > 0) {
      this.conditions.push({ field: "labels", operator: "IN", value: include });
    }
    if (exclude.length > 0) {
      this.conditions.push({
        field: "labels",
        operator: "NOT IN",
        value: exclude,
      });
    }
    return this;
  }

  component(value: string): this {
    if (value.startsWith("~")) {
      this.conditions.push({
        field: "component",
        operator: "NOT IN",
        value: [value.slice(1)],
      });
    } else {
      this.conditions.push({ field: "component", operator: "IN", value: [value] });
    }
    return this;
  }

  epic(key: string): this {
    this.addCondition('"Epic Link"', "=", key);
    return this;
  }

  sprint(value: string | number): this {
    if (typeof value === "number") {
      this.addCondition("sprint", "=", String(value));
    } else if (value === "active" || value === "current") {
      this.conditions.push({
        field: "sprint",
        operator: "IN",
        value: ["openSprints()"],
      });
    } else if (value === "future") {
      this.conditions.push({
        field: "sprint",
        operator: "IN",
        value: ["futureSprints()"],
      });
    } else if (value === "closed") {
      this.conditions.push({
        field: "sprint",
        operator: "IN",
        value: ["closedSprints()"],
      });
    } else {
      this.addCondition("sprint", "=", value);
    }
    return this;
  }

  fixVersion(version: string): this {
    this.addCondition("fixVersion", "=", version);
    return this;
  }

  created(period: string): this {
    const jqlPeriod = this.parsePeriod(period);
    this.conditions.push({
      field: "created",
      operator: ">=",
      value: jqlPeriod,
    });
    return this;
  }

  updated(period: string): this {
    const jqlPeriod = this.parsePeriod(period);
    this.conditions.push({
      field: "updated",
      operator: ">=",
      value: jqlPeriod,
    });
    return this;
  }

  watcher(user: string): this {
    this.addCondition("watcher", "=", user);
    return this;
  }

  text(query: string): this {
    this.conditions.push({
      field: "text",
      operator: "~",
      value: query,
    });
    return this;
  }

  raw(jql: string): this {
    this.conditions.push({
      field: "",
      operator: "RAW",
      value: jql,
    });
    return this;
  }

  orderBy(field: string, direction: OrderDirection = "DESC"): this {
    this.orderByField = field;
    this.orderDirection = direction;
    return this;
  }

  build(): string {
    const parts: string[] = [];

    for (const condition of this.conditions) {
      if (condition.operator === "RAW") {
        parts.push(condition.value as string);
        continue;
      }

      const formattedValue = this.formatValue(condition.value, condition.operator);
      parts.push(`${condition.field} ${condition.operator} ${formattedValue}`);
    }

    let jql = parts.join(" AND ");

    if (this.orderByField) {
      jql += ` ORDER BY ${this.orderByField} ${this.orderDirection}`;
    }

    return jql;
  }

  private addCondition(field: string, operator: string, value: string): void {
    this.conditions.push({ field, operator, value });
  }

  private formatValue(value: string | string[], operator: string): string {
    if (Array.isArray(value)) {
      if (value.length === 1 && value[0]?.includes("()")) {
        return value[0];
      }
      const formatted = value.map((v) => this.quoteValue(v)).join(", ");
      return `(${formatted})`;
    }

    if (operator === "IS") {
      return value;
    }

    if (value.includes("()")) {
      return value;
    }

    if (this.isDateValue(value)) {
      return value;
    }

    return this.quoteValue(value);
  }

  private isDateValue(value: string): boolean {
    if (/^-?\d+[dwmyh]$/i.test(value)) {
      return true;
    }
    if (/^startOf(Day|Week|Month|Year)\(\)$/i.test(value)) {
      return true;
    }
    if (/^endOf(Day|Week|Month|Year)\(\)$/i.test(value)) {
      return true;
    }
    return false;
  }

  private quoteValue(value: string): string {
    if (value.includes(" ") || value.includes('"') || value.includes("'")) {
      return `"${value.replace(/"/g, '\\"')}"`;
    }
    return `"${value}"`;
  }

  private parsePeriod(period: string): string {
    const match = period.match(/^(-?\d+)([dwmyh])$/i);
    if (match) {
      const [, num, unit] = match;
      const unitMap: Record<string, string> = {
        h: "h",
        d: "d",
        w: "w",
        m: "M",
        y: "y",
      };
      const jqlUnit = unitMap[unit?.toLowerCase() ?? "d"] ?? "d";
      return `${num}${jqlUnit}`;
    }

    const namedPeriods: Record<string, string> = {
      today: "startOfDay()",
      yesterday: "-1d",
      week: "-7d",
      month: "-30d",
      year: "-365d",
    };

    return namedPeriods[period.toLowerCase()] ?? period;
  }
}
