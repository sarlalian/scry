# Scripting and Automation Guide

Complete guide to using Scry in scripts, CI/CD pipelines, and with AI coding agents.

## Table of Contents

- [Getting Started with Scripting](#getting-started-with-scripting)
- [JSON Output for Automation](#json-output-for-automation)
- [Shell Scripting Examples](#shell-scripting-examples)
- [CI/CD Integration](#cicd-integration)
- [AI Agent Integration](#ai-agent-integration)
- [Best Practices](#best-practices)
- [Common Patterns](#common-patterns)

## Getting Started with Scripting

### Why Script with Scry?

Scry's JSON output makes it perfect for automation:
- Consistent, parseable output format
- Exit codes for error handling
- Environment variable configuration
- Non-interactive modes

### Basic Principles

1. **Use JSON output** for machine-readable data
2. **Check exit codes** for error handling
3. **Use environment variables** for configuration
4. **Parse with jq** for JSON processing
5. **Handle errors gracefully**

### First Script

```bash
#!/bin/bash
# my-first-scry-script.sh

# Get all open issues assigned to current user
scry issue list \
  -a currentUser() \
  -s "~Done" \
  -o json \
  --limit 100 > my-issues.json

# Check if command succeeded
if [ $? -eq 0 ]; then
    echo "Found $(jq '.meta.total' my-issues.json) issues"
else
    echo "Error fetching issues"
    exit 1
fi
```

## JSON Output for Automation

### Output Structure

All Scry JSON output follows this structure:

```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "maxResults": 50,
    "startAt": 0
  }
}
```

### Parsing with jq

jq is a powerful JSON processor. Install it:

```bash
# macOS
brew install jq

# Linux
apt-get install jq  # Debian/Ubuntu
yum install jq      # RedHat/CentOS

# Windows
choco install jq
```

### Common jq Patterns

#### Extract Issue Keys

```bash
scry issue list -o json | jq -r '.data[].key'
```

#### Get Specific Field

```bash
scry issue list -o json | jq -r '.data[].summary'
```

#### Filter Results

```bash
# Get high priority issues
scry issue list -o json | jq '.data[] | select(.priority == "High")'
```

#### Count Issues

```bash
scry issue list -o json | jq '.meta.total'
```

#### Extract Multiple Fields

```bash
scry issue list -o json | jq -r '.data[] | "\(.key): \(.summary)"'
```

#### Group by Field

```bash
scry issue list -o json | jq -r '.data | group_by(.status) | .[] | "\(.[0].status): \(length) issues"'
```

## Shell Scripting Examples

### Daily Standup Report

```bash
#!/bin/bash
# daily-standup.sh - Generate standup report

echo "=== Daily Standup Report ==="
echo "Date: $(date '+%Y-%m-%d')"
echo ""

# Yesterday's completed work
echo "Completed Yesterday:"
scry issue list \
  -a currentUser() \
  -s Done \
  --updated -1d \
  -o json | jq -r '.data[] | "  - \(.key): \(.summary)"'

echo ""

# Today's planned work
echo "In Progress Today:"
scry issue list \
  -a currentUser() \
  -s "In Progress" \
  -o json | jq -r '.data[] | "  - \(.key): \(.summary)"'

echo ""

# Blockers
echo "Blockers:"
scry issue list \
  -a currentUser() \
  -s Blocked \
  -o json | jq -r '.data[] | "  ⚠️  \(.key): \(.summary)"'
```

### Bulk Issue Creation

```bash
#!/bin/bash
# bulk-create.sh - Create multiple issues from a file

# issues.txt format:
# Task|Implement feature A|Description for A
# Bug|Fix bug B|Description for B

while IFS='|' read -r type summary description; do
    echo "Creating: $summary"

    scry issue create \
      -p PROJ \
      -t "$type" \
      -s "$summary" \
      -d "$description" \
      -o json > /dev/null

    if [ $? -eq 0 ]; then
        echo "  ✓ Created"
    else
        echo "  ✗ Failed"
    fi
done < issues.txt
```

### Issue Status Report

```bash
#!/bin/bash
# status-report.sh - Generate project status report

PROJECT=${1:-PROJ}
OUTPUT="status-report-$(date +%Y%m%d).md"

cat > "$OUTPUT" << EOF
# Status Report: $PROJECT
Generated: $(date)

## Summary
EOF

# Get issue counts
TOTAL=$(scry issue list -p "$PROJECT" -o json | jq '.meta.total')
TODO=$(scry issue list -p "$PROJECT" -s "To Do" -o json | jq '.meta.total')
PROGRESS=$(scry issue list -p "$PROJECT" -s "In Progress" -o json | jq '.meta.total')
DONE=$(scry issue list -p "$PROJECT" -s Done -o json | jq '.meta.total')

cat >> "$OUTPUT" << EOF

- Total Issues: $TOTAL
- To Do: $TODO
- In Progress: $PROGRESS
- Done: $DONE
- Completion: $(( DONE * 100 / TOTAL ))%

## Issues by Priority
EOF

scry issue list -p "$PROJECT" -o json | \
  jq -r '.data | group_by(.priority) | .[] | "- \(.[0].priority): \(length) issues"' >> "$OUTPUT"

cat >> "$OUTPUT" << EOF

## Recent Activity (Last 7 Days)
EOF

scry issue list -p "$PROJECT" --updated -7d --limit 20 -o json | \
  jq -r '.data[] | "- \(.key): \(.summary) (\(.status))"' >> "$OUTPUT"

echo "Report generated: $OUTPUT"
```

### Sprint Report

```bash
#!/bin/bash
# sprint-report.sh - Generate sprint report

SPRINT_ID=$1

if [ -z "$SPRINT_ID" ]; then
    echo "Usage: $0 <sprint-id>"
    exit 1
fi

echo "=== Sprint $SPRINT_ID Report ==="
echo ""

# Sprint info
scry sprint list -o json | \
  jq -r ".data[] | select(.id==$SPRINT_ID) | \"Sprint: \(.name)\nGoal: \(.goal // \"No goal set\")\""

echo ""

# Issue counts
TOTAL=$(scry issue list -q "sprint = $SPRINT_ID" -o json | jq '.meta.total')
DONE=$(scry issue list -q "sprint = $SPRINT_ID AND status = Done" -o json | jq '.meta.total')
REMAINING=$(( TOTAL - DONE ))

echo "Progress: $DONE / $TOTAL issues completed ($REMAINING remaining)"
echo ""

# Breakdown by type
echo "Issues by Type:"
scry issue list -q "sprint = $SPRINT_ID" -o json | \
  jq -r '.data | group_by(.type) | .[] | "  \(.[0].type): \(length)"'

echo ""

# Unfinished work
echo "Remaining Work:"
scry issue list -q "sprint = $SPRINT_ID AND status != Done" -o json | \
  jq -r '.data[] | "  - \(.key): \(.summary) (\(.assignee))"'
```

### Automated Issue Assignment

```bash
#!/bin/bash
# auto-assign.sh - Automatically assign unassigned issues

# Round-robin assignment
USERS=(
    "user1@example.com"
    "user2@example.com"
    "user3@example.com"
)

# Get unassigned issues
ISSUES=$(scry issue list -a x -s "To Do" --limit 10 -o json | jq -r '.data[].key')

index=0
for issue in $ISSUES; do
    assignee="${USERS[$index]}"
    echo "Assigning $issue to $assignee"

    scry issue assign "$issue" "$assignee"

    # Next user (round-robin)
    index=$(( (index + 1) % ${#USERS[@]} ))
done
```

### Epic Progress Tracker

```bash
#!/bin/bash
# epic-progress.sh - Track progress of all epics

echo "=== Epic Progress Report ==="
echo ""

# Get all epics
EPICS=$(scry issue list -t Epic -o json | jq -r '.data[].key')

for epic in $EPICS; do
    # Get epic name
    EPIC_NAME=$(scry issue view "$epic" -o json | jq -r '.data.fields.summary')

    # Count issues
    TOTAL=$(scry issue list -q "Epic = $epic" -o json | jq '.meta.total')
    DONE=$(scry issue list -q "Epic = $epic AND status = Done" -o json | jq '.meta.total')

    if [ "$TOTAL" -gt 0 ]; then
        PERCENT=$(( DONE * 100 / TOTAL ))
        echo "$epic: $EPIC_NAME"
        echo "  Progress: $DONE / $TOTAL ($PERCENT%)"
        echo ""
    fi
done
```

## CI/CD Integration

### GitHub Actions

#### Check Issues in Pull Request

```yaml
# .github/workflows/check-jira.yml
name: Check Jira Issues
on:
  pull_request:
    types: [opened, edited, synchronize]

jobs:
  check-jira:
    runs-on: ubuntu-latest
    steps:
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install Scry
        run: bun install -g scry

      - name: Extract Issue Key from PR Title
        id: extract
        run: |
          ISSUE_KEY=$(echo "${{ github.event.pull_request.title }}" | grep -oE '[A-Z]+-[0-9]+')
          echo "issue_key=$ISSUE_KEY" >> $GITHUB_OUTPUT

      - name: Check Issue Exists
        env:
          SCRY_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
          SCRY_SERVER: ${{ secrets.JIRA_SERVER }}
          SCRY_LOGIN: ${{ secrets.JIRA_LOGIN }}
        run: |
          scry issue view ${{ steps.extract.outputs.issue_key }}

      - name: Add Comment to Issue
        env:
          SCRY_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
          SCRY_SERVER: ${{ secrets.JIRA_SERVER }}
          SCRY_LOGIN: ${{ secrets.JIRA_LOGIN }}
        run: |
          scry issue comment add ${{ steps.extract.outputs.issue_key }} \
            "PR created: ${{ github.event.pull_request.html_url }}"
```

#### Update Issues on Merge

```yaml
# .github/workflows/update-jira.yml
name: Update Jira on Merge
on:
  pull_request:
    types: [closed]

jobs:
  update-jira:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install Scry
        run: bun install -g scry

      - name: Extract Issue Key
        id: extract
        run: |
          ISSUE_KEY=$(echo "${{ github.event.pull_request.title }}" | grep -oE '[A-Z]+-[0-9]+')
          echo "issue_key=$ISSUE_KEY" >> $GITHUB_OUTPUT

      - name: Move Issue to Done
        env:
          SCRY_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
          SCRY_SERVER: ${{ secrets.JIRA_SERVER }}
          SCRY_LOGIN: ${{ secrets.JIRA_LOGIN }}
        run: |
          scry issue move ${{ steps.extract.outputs.issue_key }} "Done"
          scry issue comment add ${{ steps.extract.outputs.issue_key }} \
            "PR merged: ${{ github.event.pull_request.html_url }}"
```

#### Daily Sprint Report

```yaml
# .github/workflows/sprint-report.yml
name: Daily Sprint Report
on:
  schedule:
    - cron: '0 9 * * 1-5'  # 9 AM weekdays
  workflow_dispatch:

jobs:
  sprint-report:
    runs-on: ubuntu-latest
    steps:
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1

      - name: Install Scry
        run: bun install -g scry

      - name: Generate Report
        env:
          SCRY_API_TOKEN: ${{ secrets.JIRA_API_TOKEN }}
          SCRY_SERVER: ${{ secrets.JIRA_SERVER }}
          SCRY_LOGIN: ${{ secrets.JIRA_LOGIN }}
        run: |
          echo "# Daily Sprint Report" > report.md
          echo "Generated: $(date)" >> report.md
          echo "" >> report.md

          echo "## In Progress" >> report.md
          scry issue list -q "sprint in openSprints() AND status = 'In Progress'" \
            -o json | jq -r '.data[] | "- \(.key): \(.summary) (\(.assignee))"' >> report.md

          echo "" >> report.md
          echo "## To Do" >> report.md
          scry issue list -q "sprint in openSprints() AND status = 'To Do'" \
            -o json | jq -r '.data[] | "- \(.key): \(.summary)"' >> report.md

          cat report.md

      - name: Post to Slack
        uses: slackapi/slack-github-action@v1
        with:
          payload-file-path: report.md
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
```

### GitLab CI

```yaml
# .gitlab-ci.yml
variables:
  SCRY_SERVER: $JIRA_SERVER
  SCRY_LOGIN: $JIRA_LOGIN
  SCRY_API_TOKEN: $JIRA_API_TOKEN

stages:
  - validate
  - deploy
  - notify

check-jira-issue:
  stage: validate
  image: oven/bun:latest
  script:
    - bun install -g scry
    - ISSUE_KEY=$(echo "$CI_COMMIT_MESSAGE" | grep -oE '[A-Z]+-[0-9]+')
    - scry issue view $ISSUE_KEY
  only:
    - merge_requests

update-jira-on-merge:
  stage: notify
  image: oven/bun:latest
  script:
    - bun install -g scry
    - ISSUE_KEY=$(echo "$CI_COMMIT_MESSAGE" | grep -oE '[A-Z]+-[0-9]+')
    - scry issue move $ISSUE_KEY "In Review"
    - scry issue comment add $ISSUE_KEY "Pipeline succeeded: $CI_PIPELINE_URL"
  only:
    - main
```

### Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent any

    environment {
        SCRY_SERVER = credentials('jira-server')
        SCRY_LOGIN = credentials('jira-login')
        SCRY_API_TOKEN = credentials('jira-token')
    }

    stages {
        stage('Setup') {
            steps {
                sh 'bun install -g scry'
            }
        }

        stage('Check Jira Issue') {
            steps {
                script {
                    def issueKey = sh(
                        script: "echo '${env.GIT_COMMIT_MESSAGE}' | grep -oE '[A-Z]+-[0-9]+'",
                        returnStdout: true
                    ).trim()

                    sh "scry issue view ${issueKey}"
                }
            }
        }

        stage('Update Jira') {
            when {
                branch 'main'
            }
            steps {
                script {
                    def issueKey = sh(
                        script: "echo '${env.GIT_COMMIT_MESSAGE}' | grep -oE '[A-Z]+-[0-9]+'",
                        returnStdout: true
                    ).trim()

                    sh """
                        scry issue move ${issueKey} 'In Review'
                        scry issue comment add ${issueKey} 'Build succeeded: ${env.BUILD_URL}'
                    """
                }
            }
        }
    }
}
```

## AI Agent Integration

### OpenAI Function Calling

```javascript
// ai-jira-agent.js
import OpenAI from "openai";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const openai = new OpenAI();

const tools = [
  {
    type: "function",
    function: {
      name: "list_jira_issues",
      description: "List Jira issues with optional filters",
      parameters: {
        type: "object",
        properties: {
          assignee: { type: "string", description: "Filter by assignee" },
          status: { type: "string", description: "Filter by status" },
          limit: { type: "number", description: "Maximum results" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_jira_issue",
      description: "Create a new Jira issue",
      parameters: {
        type: "object",
        properties: {
          project: { type: "string", description: "Project key" },
          type: { type: "string", description: "Issue type (Task, Bug, Story)" },
          summary: { type: "string", description: "Issue summary" },
          description: { type: "string", description: "Issue description" },
        },
        required: ["project", "type", "summary"],
      },
    },
  },
];

async function listJiraIssues(args) {
  let cmd = "scry issue list -o json";
  if (args.assignee) cmd += ` -a ${args.assignee}`;
  if (args.status) cmd += ` -s "${args.status}"`;
  if (args.limit) cmd += ` --limit ${args.limit}`;

  const { stdout } = await execAsync(cmd);
  return JSON.parse(stdout);
}

async function createJiraIssue(args) {
  const cmd = `scry issue create -p ${args.project} -t ${args.type} -s "${args.summary}" ${
    args.description ? `-d "${args.description}"` : ""
  } -o json`;

  const { stdout } = await execAsync(cmd);
  return JSON.parse(stdout);
}

async function runAgent(userMessage) {
  const messages = [
    {
      role: "system",
      content: "You are a helpful Jira assistant. Use the provided functions to help users manage their Jira issues.",
    },
    { role: "user", content: userMessage },
  ];

  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages,
    tools,
  });

  const toolCall = response.choices[0].message.tool_calls?.[0];

  if (toolCall) {
    const functionName = toolCall.function.name;
    const args = JSON.parse(toolCall.function.arguments);

    let result;
    if (functionName === "list_jira_issues") {
      result = await listJiraIssues(args);
    } else if (functionName === "create_jira_issue") {
      result = await createJiraIssue(args);
    }

    return result;
  }

  return response.choices[0].message.content;
}

// Example usage
const result = await runAgent("Show me my open issues");
console.log(result);
```

### Claude/Anthropic Integration

```javascript
// claude-jira-agent.js
import Anthropic from "@anthropic-ai/sdk";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const anthropic = new Anthropic();

const tools = [
  {
    name: "list_issues",
    description: "List Jira issues with filters",
    input_schema: {
      type: "object",
      properties: {
        jql: { type: "string", description: "JQL query" },
        limit: { type: "number", description: "Max results" },
      },
    },
  },
  {
    name: "create_issue",
    description: "Create a new Jira issue",
    input_schema: {
      type: "object",
      properties: {
        project: { type: "string" },
        type: { type: "string" },
        summary: { type: "string" },
        description: { type: "string" },
      },
      required: ["project", "type", "summary"],
    },
  },
];

async function processToolCall(name, input) {
  if (name === "list_issues") {
    const cmd = `scry issue list ${input.jql ? `-q "${input.jql}"` : ""} ${
      input.limit ? `--limit ${input.limit}` : ""
    } -o json`;
    const { stdout } = await execAsync(cmd);
    return stdout;
  } else if (name === "create_issue") {
    const cmd = `scry issue create -p ${input.project} -t ${input.type} -s "${input.summary}" ${
      input.description ? `-d "${input.description}"` : ""
    } -o json`;
    const { stdout } = await execAsync(cmd);
    return stdout;
  }
}

async function chat(message) {
  const response = await anthropic.messages.create({
    model: "claude-3-sonnet-20240229",
    max_tokens: 1024,
    tools,
    messages: [{ role: "user", content: message }],
  });

  if (response.stop_reason === "tool_use") {
    const toolUse = response.content.find((block) => block.type === "tool_use");
    const result = await processToolCall(toolUse.name, toolUse.input);

    const followUp = await anthropic.messages.create({
      model: "claude-3-sonnet-20240229",
      max_tokens: 1024,
      messages: [
        { role: "user", content: message },
        { role: "assistant", content: response.content },
        {
          role: "user",
          content: [{ type: "tool_result", tool_use_id: toolUse.id, content: result }],
        },
      ],
    });

    return followUp.content[0].text;
  }

  return response.content[0].text;
}

// Example usage
const answer = await chat("Create a bug report for login page not loading");
console.log(answer);
```

### Python AI Agent

```python
#!/usr/bin/env python3
# ai_jira_agent.py

import subprocess
import json
from openai import OpenAI

client = OpenAI()

def scry_command(cmd):
    """Execute scry command and return parsed JSON"""
    result = subprocess.run(
        cmd,
        shell=True,
        capture_output=True,
        text=True
    )
    if result.returncode == 0:
        return json.loads(result.stdout)
    else:
        raise Exception(f"Command failed: {result.stderr}")

def list_issues(filters=None):
    """List Jira issues"""
    cmd = "scry issue list -o json"
    if filters:
        if 'assignee' in filters:
            cmd += f" -a {filters['assignee']}"
        if 'status' in filters:
            cmd += f" -s '{filters['status']}'"
    return scry_command(cmd)

def create_issue(project, issue_type, summary, description=None):
    """Create Jira issue"""
    cmd = f"scry issue create -p {project} -t {issue_type} -s '{summary}'"
    if description:
        cmd += f" -d '{description}'"
    cmd += " -o json"
    return scry_command(cmd)

# Define tools for OpenAI
tools = [
    {
        "type": "function",
        "function": {
            "name": "list_issues",
            "description": "List Jira issues",
            "parameters": {
                "type": "object",
                "properties": {
                    "filters": {
                        "type": "object",
                        "properties": {
                            "assignee": {"type": "string"},
                            "status": {"type": "string"}
                        }
                    }
                }
            }
        }
    }
]

def run_agent(message):
    """Run AI agent with Jira tools"""
    response = client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "You are a Jira assistant"},
            {"role": "user", "content": message}
        ],
        tools=tools
    )

    # Handle tool calls
    if response.choices[0].message.tool_calls:
        tool_call = response.choices[0].message.tool_calls[0]
        function_name = tool_call.function.name
        args = json.loads(tool_call.function.arguments)

        if function_name == "list_issues":
            result = list_issues(args.get('filters'))
            return result

    return response.choices[0].message.content

# Example usage
if __name__ == "__main__":
    result = run_agent("Show me all my open bugs")
    print(json.dumps(result, indent=2))
```

## Best Practices

### Error Handling

Always check exit codes:

```bash
#!/bin/bash

if ! scry issue view PROJ-123 -o json > issue.json; then
    echo "Error: Failed to fetch issue"
    exit 1
fi

# Process issue.json
```

### Logging

Log all operations:

```bash
#!/bin/bash

LOG_FILE="scry-automation.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "Starting automation"
scry issue list -o json > issues.json 2>> "$LOG_FILE"
log "Completed successfully"
```

### Rate Limiting

Respect Jira API rate limits:

```bash
#!/bin/bash

# Process issues with delay
while read issue; do
    scry issue move "$issue" "In Progress"
    sleep 1  # Wait 1 second between calls
done < issue-keys.txt
```

### Idempotency

Make scripts safe to run multiple times:

```bash
#!/bin/bash

# Check if issue already exists
EXISTING=$(scry issue list -q "summary ~ '$SUMMARY'" -o json | jq '.meta.total')

if [ "$EXISTING" -eq 0 ]; then
    scry issue create -p PROJ -t Task -s "$SUMMARY"
else
    echo "Issue already exists"
fi
```

### Configuration Management

Use environment variables:

```bash
#!/bin/bash

# Load environment
if [ -f .env ]; then
    source .env
fi

# Verify required variables
if [ -z "$SCRY_API_TOKEN" ]; then
    echo "Error: SCRY_API_TOKEN not set"
    exit 1
fi

# Run commands
scry issue list
```

## Common Patterns

### Batch Processing

```bash
#!/bin/bash
# Process issues in batches

BATCH_SIZE=10
PAGE=0

while true; do
    START=$((PAGE * BATCH_SIZE))

    ISSUES=$(scry issue list -o json --limit $BATCH_SIZE | jq -r '.data[].key')

    if [ -z "$ISSUES" ]; then
        break
    fi

    for issue in $ISSUES; do
        # Process each issue
        echo "Processing $issue"
    done

    PAGE=$((PAGE + 1))
done
```

### Parallel Processing

```bash
#!/bin/bash
# Process issues in parallel

export -f process_issue  # Export function for parallel

scry issue list -o json | jq -r '.data[].key' | \
    parallel -j4 process_issue {}
```

### Retry Logic

```bash
#!/bin/bash
# Retry failed operations

MAX_RETRIES=3

for i in $(seq 1 $MAX_RETRIES); do
    if scry issue view PROJ-123 -o json > issue.json; then
        break
    fi

    echo "Attempt $i failed, retrying..."
    sleep $((i * 2))
done
```

### Data Transformation

```bash
#!/bin/bash
# Transform Jira data for external systems

scry issue list -o json | \
    jq '.data | map({
        id: .key,
        title: .summary,
        status: .status,
        owner: .assignee,
        created: .created,
        updated: .updated
    })' > transformed.json
```

## Related Documentation

- [Configuration](configuration.md) - Setting up for automation
- [Issue Commands](commands/issues.md) - Issue management
- [Troubleshooting](troubleshooting.md) - Common issues
