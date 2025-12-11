# Troubleshooting Guide

Common issues and solutions when using Scry.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Configuration Issues](#configuration-issues)
- [Authentication Issues](#authentication-issues)
- [Connection Issues](#connection-issues)
- [Command Errors](#command-errors)
- [Performance Issues](#performance-issues)
- [Output Issues](#output-issues)
- [Permission Issues](#permission-issues)

## Installation Issues

### Bun Not Found

**Problem**: `bun: command not found` when installing or running Scry

**Solutions**:
```bash
# Install Bun
curl -fsSL https://bun.sh/install | bash

# Restart terminal or reload shell config
source ~/.bashrc  # or ~/.zshrc

# Verify installation
bun --version
```

### Global Install Fails

**Problem**: Cannot install Scry globally

**Solutions**:
```bash
# Try with sudo (macOS/Linux)
sudo bun install -g scry

# Or install without global flag
bun install scry
# Then run with: bunx scry

# Or use npm instead
npm install -g scry
```

### Binary Not Executable

**Problem**: Binary downloaded but won't execute

**Solutions**:
```bash
# Make binary executable
chmod +x scry

# Move to PATH
sudo mv scry /usr/local/bin/

# Verify
which scry
scry --version
```

### Binary Architecture Mismatch

**Problem**: Binary won't run on your system

**Solutions**:
- Download correct binary for your platform (macOS, Linux, Windows)
- Check architecture (Intel vs ARM/M1/M2)
- Build from source:
  ```bash
  git clone https://github.com/sarlalian/scry.git
  cd scry
  bun install
  bun run build:local
  ```

## Configuration Issues

### Configuration File Not Found

**Problem**: `No configuration file found` error

**Solutions**:
```bash
# Create configuration
scry init

# Or specify custom path
scry -c /path/to/config.yml issue list

# Or set environment variable
export SCRY_CONFIG_FILE=~/.config/scry/config.yml
```

### Invalid YAML Syntax

**Problem**: Error parsing configuration file

**Solutions**:
1. Check YAML syntax (indentation matters)
2. Use YAML validator: https://www.yamllint.com/
3. Common mistakes:
   ```yaml
   # Wrong (tabs)
   server:	https://domain.atlassian.net

   # Correct (spaces)
   server: https://domain.atlassian.net

   # Wrong (missing colon)
   server https://domain.atlassian.net

   # Correct
   server: https://domain.atlassian.net
   ```

### Wrong Configuration Used

**Problem**: Scry using unexpected configuration

**Solutions**:
```bash
# Check which config file is being used
# Scry searches in this order:
# 1. $SCRY_CONFIG_FILE
# 2. ./.scry.yml
# 3. ~/.config/scry/config.yml
# 4. ~/.scry.yml

# List all config files
ls -la .scry.yml ~/.scry.yml ~/.config/scry/config.yml

# Use specific config
scry -c ~/.config/scry/work.yml issue list
```

## Authentication Issues

### API Token Not Set

**Problem**: Authentication fails, token not found

**Solutions**:
```bash
# Set API token
export SCRY_API_TOKEN=your-token-here

# Verify it's set
echo $SCRY_API_TOKEN

# Add to shell config for persistence
echo 'export SCRY_API_TOKEN=your-token' >> ~/.bashrc
source ~/.bashrc
```

### Invalid API Token

**Problem**: Authentication fails with invalid credentials

**Solutions**:
1. Generate new API token:
   - Go to https://id.atlassian.com/manage-profile/security/api-tokens
   - Click "Create API token"
   - Copy and set: `export SCRY_API_TOKEN=new-token`

2. Verify token is correct (no extra spaces/characters)

3. Check if token expired (tokens don't expire but can be revoked)

### Wrong Authentication Type

**Problem**: Authentication fails despite valid token

**Solutions**:
```yaml
# Try different auth type in config
auth:
  type: basic  # or 'bearer'
```

Or:
```bash
export SCRY_AUTH_TYPE=basic
```

Most Atlassian Cloud instances use `basic`.

### 401 Unauthorized Error

**Problem**: `401 Unauthorized` when running commands

**Solutions**:
1. Verify API token: `echo $SCRY_API_TOKEN`
2. Check login email matches Jira account
3. Regenerate API token
4. Verify server URL is correct
5. Test authentication: `scry me`

## Connection Issues

### Cannot Connect to Server

**Problem**: Network errors or timeouts

**Solutions**:
1. Verify server URL:
   ```yaml
   # Correct (include https://)
   server: https://domain.atlassian.net

   # Wrong (missing protocol)
   server: domain.atlassian.net
   ```

2. Check internet connection
3. Try accessing Jira in browser
4. Check firewall/proxy settings
5. For corporate networks, configure proxy if needed

### SSL/TLS Errors

**Problem**: SSL certificate errors

**Solutions**:
```bash
# For self-signed certificates (not recommended for production)
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Better: Install proper certificates
# Contact your Jira administrator
```

### Request Timeout

**Problem**: Commands timeout

**Solutions**:
1. Check network connection
2. Try with smaller `--limit`:
   ```bash
   scry issue list --limit 10
   ```
3. Simplify JQL queries
4. Check Jira server status

## Command Errors

### Issue Not Found

**Problem**: `Issue not found` error

**Solutions**:
1. Verify issue key is correct: `PROJ-123` (uppercase, dash, number)
2. Check you have permission to view the issue
3. Verify issue exists in Jira
4. Check project key is correct

### Invalid JQL Query

**Problem**: JQL query fails

**Solutions**:
1. Test JQL in Jira's issue search first
2. Use quotes for values with spaces:
   ```bash
   scry issue list -q "status = 'In Progress'"
   ```
3. Escape special characters
4. Check JQL syntax: https://support.atlassian.com/jira-software-cloud/docs/use-advanced-search-with-jira-query-language-jql/

### Field Not Found

**Problem**: Cannot set field or field doesn't exist

**Solutions**:
1. Verify field name matches Jira exactly (case-sensitive)
2. Check if field exists in project
3. Use Jira field IDs for custom fields
4. Some fields may not be editable via API

### Transition Not Available

**Problem**: Cannot move issue to status

**Solutions**:
1. Check available transitions:
   ```bash
   scry issue move PROJ-123
   ```
2. Status name must match exactly (case-sensitive)
3. Issue may not be in correct starting status
4. Workflow may prevent transition

### Permission Denied

**Problem**: Cannot perform action due to permissions

**Solutions**:
1. Verify you have permission in Jira
2. Check project permissions
3. Some actions require specific roles (admin, project lead)
4. Contact Jira administrator

## Performance Issues

### Slow List Commands

**Problem**: Listing issues takes too long

**Solutions**:
```bash
# Use smaller limits
scry issue list --limit 10

# Filter more specifically
scry issue list -s "In Progress" -a currentUser()

# Use simpler JQL
scry issue list -q "project = PROJ AND status = 'To Do'"
```

### Large Result Sets

**Problem**: Too much data returned

**Solutions**:
```bash
# Paginate results
scry issue list --limit 50

# Filter by date
scry issue list --created -7d

# Filter by specific criteria
scry issue list -t Bug -y High
```

### JSON Parsing Slow

**Problem**: jq or JSON processing is slow

**Solutions**:
```bash
# Use head to limit before processing
scry issue list -o json | jq '.data | .[:10]'

# Use more specific jq filters
scry issue list -o json | jq -r '.data[].key'  # vs full object
```

## Output Issues

### Colors Not Working

**Problem**: No color in terminal output

**Solutions**:
```bash
# Check if colors are disabled in config
# Enable colors:
scry issue list  # colors enabled by default

# Force colors on
export FORCE_COLOR=1

# Or fix terminal color support
export TERM=xterm-256color
```

### Colors Not Wanted

**Problem**: Colors causing issues

**Solutions**:
```bash
# Disable colors
scry issue list --no-color

# Or in config:
# output:
#   colors: false

# Or environment variable:
export NO_COLOR=1
```

### JSON Output Malformed

**Problem**: JSON output not valid

**Solutions**:
1. Verify using JSON validator
2. Check for errors before pipe:
   ```bash
   scry issue list -o json > output.json
   cat output.json | jq '.'
   ```
3. Look for error messages in output

### Table Layout Broken

**Problem**: Table columns misaligned

**Solutions**:
```bash
# Use plain format
scry issue list -o plain

# Increase terminal width
# Or export to file
scry issue list > output.txt

# Use custom columns
scry issue list --columns key,summary,status
```

### Encoding Issues

**Problem**: Special characters not displaying

**Solutions**:
```bash
# Set UTF-8 encoding
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8

# Or use plain ASCII
scry issue list -o plain
```

## Permission Issues

### Cannot Create Issues

**Problem**: Permission denied when creating issues

**Solutions**:
1. Verify you have "Create Issues" permission in project
2. Check if project allows your user role to create issues
3. Some issue types may be restricted
4. Contact project administrator

### Cannot Edit Issues

**Problem**: Cannot update issue fields

**Solutions**:
1. Check "Edit Issues" permission
2. Some fields may be locked by workflow
3. Issues may be in states that prevent editing
4. Check field-level security

### Cannot Delete Issues

**Problem**: Cannot delete issues

**Solutions**:
1. Delete requires special "Delete Issues" permission
2. Only admins may have this permission
3. Consider transitioning to "Won't Do" instead
4. Contact administrator

### Cannot Manage Sprints

**Problem**: Cannot create or modify sprints

**Solutions**:
1. Verify you have "Manage Sprints" permission on board
2. Only Scrum boards support sprints
3. Board administrators may be required
4. Contact board administrator

## Debug Mode

Enable debug output for troubleshooting:

```bash
# Enable debug output
scry --debug issue list

# Shows:
# - Configuration being used
# - API calls being made
# - JQL queries
# - Response data

# Example output:
# JQL: project = PROJ AND status = 'To Do'
# Fetching from: /rest/api/3/search
# Response: 200 OK
```

## Getting Help

If you still have issues:

1. **Check logs** - Look for error messages in output

2. **Try simple command** - Test with basic command:
   ```bash
   scry me
   ```

3. **Verify setup** - Check configuration and authentication:
   ```bash
   echo $SCRY_API_TOKEN
   cat ~/.config/scry/config.yml
   ```

4. **Test in Jira** - Try the same operation in Jira UI

5. **Check permissions** - Verify in Jira you can do the action

6. **Search issues** - Check GitHub issues:
   https://github.com/sarlalian/scry/issues

7. **Ask for help** - Create new issue with:
   - Scry version: `scry --version`
   - Command you're running
   - Error message
   - Configuration (without token)
   - OS and environment

## Common Error Messages

### "No configuration file found"
- Run `scry init` to create configuration
- Or specify config: `scry -c path/to/config.yml`

### "Authentication failed"
- Check `SCRY_API_TOKEN` is set
- Verify token is valid
- Confirm login email is correct

### "Issue not found"
- Verify issue key is correct
- Check you have permission to view
- Confirm issue exists in Jira

### "Invalid JQL query"
- Test query in Jira UI first
- Check syntax and quotes
- Escape special characters

### "Permission denied"
- Verify you have required permission in Jira
- Contact project or board administrator
- Check role and permissions

### "Connection refused" / "ECONNREFUSED"
- Check server URL is correct
- Verify network connection
- Check firewall settings
- Confirm Jira server is accessible

### "Request timeout"
- Check network connection
- Reduce result limit
- Simplify query
- Check Jira server status

## Tips for Avoiding Issues

### Configuration
- Always use environment variables for tokens
- Keep config file syntax clean
- Use absolute paths when possible
- Test config with `scry me`

### Commands
- Start with simple commands
- Test JQL in Jira UI first
- Use `--debug` flag for troubleshooting
- Check permissions before operations

### Scripts
- Always check exit codes
- Handle errors gracefully
- Use JSON output for parsing
- Test incrementally

### Performance
- Use filters to limit results
- Paginate large datasets
- Be specific with queries
- Respect API rate limits

## Related Documentation

- [Getting Started](getting-started.md) - Initial setup
- [Configuration](configuration.md) - Configuration guide
- [Commands](commands/issues.md) - Command reference
- [Scripting](scripting.md) - Automation guide
