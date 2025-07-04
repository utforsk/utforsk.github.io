# Claude Code Configuration

## Project Guidelines

### Code Style & Standards
- Always write code in English (comments, function names, variables, etc.)
- Follow existing code style and conventions in the project
- Use modern, robust code patterns
- When using frameworks, use the latest version and syntax
- Match existing indentation, naming conventions, and code structure

### Git & Version Control
- Use conventional commit messages (feat:, fix:, docs:, etc.)
- Never include author information in commit messages
- Keep commits focused and atomic
- If there are a version defined in the project, html, javascript file or similar, you should always bump the version to match how big the change is.

### Language Requirements
- Communication: Norwegian or English only
- Code: Always English (no exceptions)
- Documentation: Match project's existing language preference

### Development Practices
- Prefer editing existing files over creating new ones
- Only create files when absolutely necessary
- Never proactively create documentation files unless explicitly requested
- Always verify solutions with tests when available
- Run lint and typecheck commands before completing tasks

### Framework & Technology Guidelines
- Check package.json/requirements.txt/etc. for existing dependencies
- Use libraries already present in the project
- Follow security best practices
- Never expose or log secrets/keys

## Available Commands
(Project-specific commands should be documented in individual project CLAUDE.md files)

## Testing
- Check README or search codebase for testing approach
- Never assume specific test frameworks
- Verify solutions with existing test suites

## Notes
- This is a multi-project repository
- Each sub-project may have its own CLAUDE.md with specific instructions
- Global guidelines above apply to all projects unless overridden locally
