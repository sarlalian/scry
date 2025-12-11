export function generateBashCompletion(): string {
  return `_scry_completion() {
    local cur prev commands flags output_formats
    cur="\${COMP_WORDS[COMP_CWORD]}"
    prev="\${COMP_WORDS[COMP_CWORD-1]}"

    commands="init issue epic sprint project board release user me open completion"
    flags="--output --project --config --debug --version --help --no-color"
    output_formats="table plain json xml csv"

    case "\${prev}" in
        --output|-o)
            COMPREPLY=( $(compgen -W "\${output_formats}" -- \${cur}) )
            return 0
            ;;
        scry)
            COMPREPLY=( $(compgen -W "\${commands}" -- \${cur}) )
            return 0
            ;;
        issue)
            COMPREPLY=( $(compgen -W "list view create clone assign move edit comment delete" -- \${cur}) )
            return 0
            ;;
        epic)
            COMPREPLY=( $(compgen -W "list create add remove" -- \${cur}) )
            return 0
            ;;
        sprint)
            COMPREPLY=( $(compgen -W "list create add" -- \${cur}) )
            return 0
            ;;
        project)
            COMPREPLY=( $(compgen -W "list" -- \${cur}) )
            return 0
            ;;
        board)
            COMPREPLY=( $(compgen -W "list" -- \${cur}) )
            return 0
            ;;
        release)
            COMPREPLY=( $(compgen -W "list create" -- \${cur}) )
            return 0
            ;;
        user)
            COMPREPLY=( $(compgen -W "search" -- \${cur}) )
            return 0
            ;;
        completion)
            COMPREPLY=( $(compgen -W "bash zsh fish" -- \${cur}) )
            return 0
            ;;
    esac

    if [[ \${cur} == -* ]]; then
        COMPREPLY=( $(compgen -W "\${flags}" -- \${cur}) )
        return 0
    fi

    COMPREPLY=( $(compgen -W "\${commands}" -- \${cur}) )
}

complete -F _scry_completion scry
`;
}

/* eslint-disable no-useless-escape */
export function generateZshCompletion(): string {
  return `#compdef scry

_scry() {
    local -a commands issue_cmds epic_cmds sprint_cmds project_cmds board_cmds release_cmds user_cmds output_formats

    commands=(
        'init:Initialize scry configuration'
        'issue:Manage Jira issues'
        'epic:Manage Jira epics'
        'sprint:Manage Jira sprints'
        'project:Manage Jira projects'
        'board:Manage Jira boards'
        'release:Manage Jira releases'
        'user:Manage Jira users'
        'me:Get current user information'
        'open:Open a Jira resource in the browser'
        'completion:Generate shell completion scripts'
    )

    issue_cmds=(
        'list:List issues'
        'view:View issue details'
        'create:Create a new issue'
        'clone:Clone an existing issue'
        'assign:Assign an issue'
        'move:Move/transition an issue'
        'edit:Edit an issue'
        'comment:Add a comment to an issue'
        'delete:Delete an issue'
    )

    epic_cmds=(
        'list:List epics'
        'create:Create a new epic'
        'add:Add issues to an epic'
        'remove:Remove issues from an epic'
    )

    sprint_cmds=(
        'list:List sprints'
        'create:Create a new sprint'
        'add:Add issues to a sprint'
    )

    project_cmds=(
        'list:List projects'
    )

    board_cmds=(
        'list:List boards'
    )

    release_cmds=(
        'list:List releases'
        'create:Create a new release'
    )

    user_cmds=(
        'search:Search users'
    )

    output_formats=(
        'table:Table format'
        'plain:Plain text format'
        'json:JSON format'
        'xml:XML format'
        'csv:CSV format'
    )

    _arguments -C \\
        '(-V --version)'{-V,--version}'[Show version]' \\
        '(-h --help)'{-h,--help}'[Show help]' \\
        '(-c --config)'{-c,--config}'[Config file path]:file:_files' \\
        '(-p --project)'{-p,--project}'[Jira project key]:project:' \\
        '--debug[Enable debug output]' \\
        '(-o --output)'{-o,--output}'[Output format]:format:->output_formats' \\
        '--no-color[Disable colored output]' \\
        '1: :->cmds' \\
        '*::arg:->args'

    case \$state in
        cmds)
            _describe -t commands 'scry commands' commands
            ;;
        output_formats)
            _describe -t output_formats 'output formats' output_formats
            ;;
        args)
            case \$line[1] in
                issue)
                    _describe -t issue_cmds 'issue commands' issue_cmds
                    ;;
                epic)
                    _describe -t epic_cmds 'epic commands' epic_cmds
                    ;;
                sprint)
                    _describe -t sprint_cmds 'sprint commands' sprint_cmds
                    ;;
                project)
                    _describe -t project_cmds 'project commands' project_cmds
                    ;;
                board)
                    _describe -t board_cmds 'board commands' board_cmds
                    ;;
                release)
                    _describe -t release_cmds 'release commands' release_cmds
                    ;;
                user)
                    _describe -t user_cmds 'user commands' user_cmds
                    ;;
                completion)
                    _arguments '1: :(bash zsh fish)'
                    ;;
            esac
            ;;
    esac
}

_scry
`;
}
/* eslint-enable no-useless-escape */

export function generateFishCompletion(): string {
  return `# scry fish completion

# Main commands
complete -c scry -f -n "__fish_use_subcommand" -a "init" -d "Initialize scry configuration"
complete -c scry -f -n "__fish_use_subcommand" -a "issue" -d "Manage Jira issues"
complete -c scry -f -n "__fish_use_subcommand" -a "epic" -d "Manage Jira epics"
complete -c scry -f -n "__fish_use_subcommand" -a "sprint" -d "Manage Jira sprints"
complete -c scry -f -n "__fish_use_subcommand" -a "project" -d "Manage Jira projects"
complete -c scry -f -n "__fish_use_subcommand" -a "board" -d "Manage Jira boards"
complete -c scry -f -n "__fish_use_subcommand" -a "release" -d "Manage Jira releases"
complete -c scry -f -n "__fish_use_subcommand" -a "user" -d "Manage Jira users"
complete -c scry -f -n "__fish_use_subcommand" -a "me" -d "Get current user information"
complete -c scry -f -n "__fish_use_subcommand" -a "open" -d "Open a Jira resource in the browser"
complete -c scry -f -n "__fish_use_subcommand" -a "completion" -d "Generate shell completion scripts"

# Global flags
complete -c scry -s V -l version -d "Show version"
complete -c scry -s h -l help -d "Show help"
complete -c scry -s c -l config -r -d "Config file path"
complete -c scry -s p -l project -r -d "Jira project key"
complete -c scry -l debug -d "Enable debug output"
complete -c scry -s o -l output -r -f -a "table plain json xml csv" -d "Output format"
complete -c scry -l no-color -d "Disable colored output"

# Issue subcommands
complete -c scry -f -n "__fish_seen_subcommand_from issue; and not __fish_seen_subcommand_from list view create clone assign move edit comment delete" -a "list" -d "List issues"
complete -c scry -f -n "__fish_seen_subcommand_from issue; and not __fish_seen_subcommand_from list view create clone assign move edit comment delete" -a "view" -d "View issue details"
complete -c scry -f -n "__fish_seen_subcommand_from issue; and not __fish_seen_subcommand_from list view create clone assign move edit comment delete" -a "create" -d "Create a new issue"
complete -c scry -f -n "__fish_seen_subcommand_from issue; and not __fish_seen_subcommand_from list view create clone assign move edit comment delete" -a "clone" -d "Clone an existing issue"
complete -c scry -f -n "__fish_seen_subcommand_from issue; and not __fish_seen_subcommand_from list view create clone assign move edit comment delete" -a "assign" -d "Assign an issue"
complete -c scry -f -n "__fish_seen_subcommand_from issue; and not __fish_seen_subcommand_from list view create clone assign move edit comment delete" -a "move" -d "Move/transition an issue"
complete -c scry -f -n "__fish_seen_subcommand_from issue; and not __fish_seen_subcommand_from list view create clone assign move edit comment delete" -a "edit" -d "Edit an issue"
complete -c scry -f -n "__fish_seen_subcommand_from issue; and not __fish_seen_subcommand_from list view create clone assign move edit comment delete" -a "comment" -d "Add a comment to an issue"
complete -c scry -f -n "__fish_seen_subcommand_from issue; and not __fish_seen_subcommand_from list view create clone assign move edit comment delete" -a "delete" -d "Delete an issue"

# Epic subcommands
complete -c scry -f -n "__fish_seen_subcommand_from epic; and not __fish_seen_subcommand_from list create add remove" -a "list" -d "List epics"
complete -c scry -f -n "__fish_seen_subcommand_from epic; and not __fish_seen_subcommand_from list create add remove" -a "create" -d "Create a new epic"
complete -c scry -f -n "__fish_seen_subcommand_from epic; and not __fish_seen_subcommand_from list create add remove" -a "add" -d "Add issues to an epic"
complete -c scry -f -n "__fish_seen_subcommand_from epic; and not __fish_seen_subcommand_from list create add remove" -a "remove" -d "Remove issues from an epic"

# Sprint subcommands
complete -c scry -f -n "__fish_seen_subcommand_from sprint; and not __fish_seen_subcommand_from list create add" -a "list" -d "List sprints"
complete -c scry -f -n "__fish_seen_subcommand_from sprint; and not __fish_seen_subcommand_from list create add" -a "create" -d "Create a new sprint"
complete -c scry -f -n "__fish_seen_subcommand_from sprint; and not __fish_seen_subcommand_from list create add" -a "add" -d "Add issues to a sprint"

# Project subcommands
complete -c scry -f -n "__fish_seen_subcommand_from project" -a "list" -d "List projects"

# Board subcommands
complete -c scry -f -n "__fish_seen_subcommand_from board" -a "list" -d "List boards"

# Release subcommands
complete -c scry -f -n "__fish_seen_subcommand_from release; and not __fish_seen_subcommand_from list create" -a "list" -d "List releases"
complete -c scry -f -n "__fish_seen_subcommand_from release; and not __fish_seen_subcommand_from list create" -a "create" -d "Create a new release"

# User subcommands
complete -c scry -f -n "__fish_seen_subcommand_from user" -a "search" -d "Search users"

# Completion subcommands
complete -c scry -f -n "__fish_seen_subcommand_from completion" -a "bash" -d "Generate bash completion"
complete -c scry -f -n "__fish_seen_subcommand_from completion" -a "zsh" -d "Generate zsh completion"
complete -c scry -f -n "__fish_seen_subcommand_from completion" -a "fish" -d "Generate fish completion"
`;
}

export function getCompletion(shell: string): string {
  const normalized = shell.toLowerCase();
  switch (normalized) {
    case "bash":
      return generateBashCompletion();
    case "zsh":
      return generateZshCompletion();
    case "fish":
      return generateFishCompletion();
    default:
      throw new Error(`Unsupported shell: ${shell}`);
  }
}

export function validateShell(shell: string): boolean {
  return ["bash", "zsh", "fish"].includes(shell.toLowerCase());
}
