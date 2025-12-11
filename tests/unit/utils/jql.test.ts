import { describe, expect, test } from "bun:test";
import { JqlBuilder } from "../../../src/utils/jql.ts";

describe("JqlBuilder", () => {
  test("builds simple project condition", () => {
    const jql = new JqlBuilder().project("PROJ").build();
    expect(jql).toBe('project = "PROJ"');
  });

  test("builds complex query with multiple conditions", () => {
    const jql = new JqlBuilder()
      .project("PROJ")
      .assignee("john.doe")
      .status("In Progress")
      .priority("High")
      .orderBy("created", "DESC")
      .build();

    expect(jql).toBe(
      'project = "PROJ" AND assignee = "john.doe" AND status = "In Progress" AND priority = "High" ORDER BY created DESC'
    );
  });

  test("handles negation with tilde prefix for status", () => {
    const jql = new JqlBuilder().project("PROJ").status("~Done").build();
    expect(jql).toBe('project = "PROJ" AND status != "Done"');
  });

  test("handles negation with tilde prefix for type", () => {
    const jql = new JqlBuilder().project("PROJ").type("~Epic").build();
    expect(jql).toBe('project = "PROJ" AND issuetype != "Epic"');
  });

  test("handles unassigned with x", () => {
    const jql = new JqlBuilder().project("PROJ").assignee("x").build();
    expect(jql).toBe('project = "PROJ" AND assignee IS EMPTY');
  });

  test("handles unassigned with keyword", () => {
    const jql = new JqlBuilder().project("PROJ").assignee("unassigned").build();
    expect(jql).toBe('project = "PROJ" AND assignee IS EMPTY');
  });

  test("handles labels IN condition", () => {
    const jql = new JqlBuilder().project("PROJ").label("backend").build();
    expect(jql).toBe('project = "PROJ" AND labels IN ("backend")');
  });

  test("handles multiple labels with negation", () => {
    const jql = new JqlBuilder().project("PROJ").labels(["backend", "~frontend"]).build();
    expect(jql).toBe('project = "PROJ" AND labels IN ("backend") AND labels NOT IN ("frontend")');
  });

  test("handles active sprint", () => {
    const jql = new JqlBuilder().project("PROJ").sprint("active").build();
    expect(jql).toBe('project = "PROJ" AND sprint IN openSprints()');
  });

  test("handles sprint by ID", () => {
    const jql = new JqlBuilder().project("PROJ").sprint(123).build();
    expect(jql).toBe('project = "PROJ" AND sprint = "123"');
  });

  test("handles date period with shorthand", () => {
    const jql = new JqlBuilder().project("PROJ").created("-7d").build();
    expect(jql).toBe('project = "PROJ" AND created >= -7d');
  });

  test("handles date period with named value", () => {
    const jql = new JqlBuilder().project("PROJ").updated("week").build();
    expect(jql).toBe('project = "PROJ" AND updated >= -7d');
  });

  test("handles text search", () => {
    const jql = new JqlBuilder().project("PROJ").text("login bug").build();
    expect(jql).toBe('project = "PROJ" AND text ~ "login bug"');
  });

  test("handles raw JQL passthrough", () => {
    const jql = new JqlBuilder().project("PROJ").raw("resolution IS EMPTY").build();
    expect(jql).toBe('project = "PROJ" AND resolution IS EMPTY');
  });

  test("handles ASC ordering", () => {
    const jql = new JqlBuilder().project("PROJ").orderBy("updated", "ASC").build();
    expect(jql).toBe('project = "PROJ" ORDER BY updated ASC');
  });

  test("escapes values with special characters", () => {
    const jql = new JqlBuilder().project("PROJ").status("To Do").build();
    expect(jql).toBe('project = "PROJ" AND status = "To Do"');
  });

  test("handles epic link", () => {
    const jql = new JqlBuilder().project("PROJ").epic("PROJ-100").build();
    expect(jql).toBe('project = "PROJ" AND "Epic Link" = "PROJ-100"');
  });

  test("handles fix version", () => {
    const jql = new JqlBuilder().project("PROJ").fixVersion("1.0.0").build();
    expect(jql).toBe('project = "PROJ" AND fixVersion = "1.0.0"');
  });

  test("handles component", () => {
    const jql = new JqlBuilder().project("PROJ").component("API").build();
    expect(jql).toBe('project = "PROJ" AND component IN ("API")');
  });

  test("handles reporter", () => {
    const jql = new JqlBuilder().project("PROJ").reporter("jane.doe").build();
    expect(jql).toBe('project = "PROJ" AND reporter = "jane.doe"');
  });

  test("handles watcher", () => {
    const jql = new JqlBuilder().project("PROJ").watcher("currentUser()").build();
    expect(jql).toBe('project = "PROJ" AND watcher = currentUser()');
  });
});
