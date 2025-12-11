import React, { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Issue } from "../api/types/issue.ts";

export interface ExplorerProps {
  issues: Issue[];
  onSelect?: (issue: Issue) => void;
  onExit?: () => void;
}

interface ExplorerState {
  selectedIndex: number;
  searchMode: boolean;
  searchText: string;
}

export function Explorer({ issues, onSelect, onExit }: ExplorerProps) {
  const [state, setState] = useState<ExplorerState>({
    selectedIndex: 0,
    searchMode: false,
    searchText: "",
  });

  const filteredIssues = state.searchText
    ? issues.filter(
        (issue) =>
          issue.key.toLowerCase().includes(state.searchText.toLowerCase()) ||
          issue.fields.summary.toLowerCase().includes(state.searchText.toLowerCase()) ||
          issue.fields.status.name.toLowerCase().includes(state.searchText.toLowerCase()) ||
          issue.fields.assignee?.displayName?.toLowerCase().includes(state.searchText.toLowerCase())
      )
    : issues;

  // Reset selection if filtered list changes
  useEffect(() => {
    if (state.selectedIndex >= filteredIssues.length && filteredIssues.length > 0) {
      setState((prev) => ({ ...prev, selectedIndex: 0 }));
    }
  }, [filteredIssues.length, state.selectedIndex]);

  useInput((input, key) => {
    if (state.searchMode) {
      if (key.escape) {
        setState((prev) => ({ ...prev, searchMode: false, searchText: "" }));
      } else if (key.return) {
        setState((prev) => ({ ...prev, searchMode: false }));
      } else if (key.backspace || key.delete) {
        setState((prev) => ({
          ...prev,
          searchText: prev.searchText.slice(0, -1),
        }));
      } else if (input && !key.ctrl && !key.meta) {
        setState((prev) => ({
          ...prev,
          searchText: prev.searchText + input,
        }));
      }
      return;
    }

    if (input === "q" || key.escape) {
      onExit?.();
      return;
    }

    if (input === "/") {
      setState((prev) => ({ ...prev, searchMode: true, searchText: "" }));
      return;
    }

    if (key.return) {
      const selectedIssue = filteredIssues[state.selectedIndex];
      if (selectedIssue) {
        onSelect?.(selectedIssue);
      }
      return;
    }

    if (key.downArrow || input === "j") {
      setState((prev) => ({
        ...prev,
        selectedIndex: prev.selectedIndex + 1 >= filteredIssues.length ? 0 : prev.selectedIndex + 1,
      }));
      return;
    }

    if (key.upArrow || input === "k") {
      setState((prev) => ({
        ...prev,
        selectedIndex:
          prev.selectedIndex - 1 < 0 ? filteredIssues.length - 1 : prev.selectedIndex - 1,
      }));
      return;
    }
  });

  if (issues.length === 0) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">No issues found</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Issues ({filteredIssues.length})
        </Text>
        {state.searchMode && <Text color="yellow"> Search: {state.searchText}_</Text>}
        {state.searchText && !state.searchMode && (
          <Text color="green"> Filter: {state.searchText}</Text>
        )}
      </Box>

      <Box flexDirection="column">
        <Box>
          <Box width={12}>
            <Text bold>Key</Text>
          </Box>
          <Box width={50}>
            <Text bold>Summary</Text>
          </Box>
          <Box width={14}>
            <Text bold>Status</Text>
          </Box>
          <Box width={18}>
            <Text bold>Assignee</Text>
          </Box>
        </Box>

        {filteredIssues.length === 0 ? (
          <Box marginTop={1}>
            <Text color="yellow">No issues match your search</Text>
          </Box>
        ) : (
          filteredIssues.map((issue, index) => {
            const isSelected = index === state.selectedIndex;
            const summary =
              issue.fields.summary.length > 48
                ? issue.fields.summary.slice(0, 47) + "…"
                : issue.fields.summary;

            return (
              <Box key={issue.id} backgroundColor={isSelected ? "blue" : undefined}>
                <Box width={12}>
                  <Text color={isSelected ? "white" : "cyan"}>{issue.key}</Text>
                </Box>
                <Box width={50}>
                  <Text color={isSelected ? "white" : undefined}>{summary}</Text>
                </Box>
                <Box width={14}>
                  <Text color={isSelected ? "white" : "yellow"}>{issue.fields.status.name}</Text>
                </Box>
                <Box width={18}>
                  <Text color={isSelected ? "white" : undefined}>
                    {issue.fields.assignee?.displayName ?? "-"}
                  </Text>
                </Box>
              </Box>
            );
          })
        )}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>
          {state.searchMode
            ? "Type to search, ESC to cancel"
            : "↑/↓ or j/k: navigate | Enter: select | /: search | q/ESC: quit"}
        </Text>
      </Box>
    </Box>
  );
}
