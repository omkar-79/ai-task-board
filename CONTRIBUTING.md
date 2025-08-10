# Contributing to AI Task Board
=============================

Thanks for thinking about contributing — love that. This guide keeps contributions consistent and fast to review.

## Table of Contents
-----------------

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Before You Start](#before-you-start)
- [Project Setup](#project-setup)
- [Branching & Commits](#branching--commits)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Security](#security)
- [Releases](#releases)
- [Community](#community)
- [License](#license)

    

## Code of Conduct
---------------

By participating, you agree to uphold our **Code of Conduct** (see CODE\_OF\_CONDUCT.md). Be kind, be constructive.

## Ways to Contribute
------------------

- **Bug fixes** – small or large
    
- **Features** – discuss via issue before building
    
- **Docs** – README, guides, examples, comments
    
- **DX** – CI, tooling, configs, dev ergonomics
    
- **Testing** – add coverage, improve reliability
    

## Before You Start
----------------

1.  **Search issues** to avoid duplicates.
    
2.  For new features or breaking changes, **open an issue** to align on scope.
    
3.  Check labels like good first issue and help wanted if you’re new.
    

## Project Setup
-------------

**Requirements**

**Requirements**
- Node.js **>= 20**
- npm **>= 10** (or yarn/pnpm if you prefer)
- Git
    

**1) Fork & clone**

```bash
git clone https://github.com/<your-username>/ai-task-board.git
cd ai-task-board
git remote add upstream https://github.com/omkar-79/ai-task-board.git 
```

**2) Install deps**

```bash
npm ci
# or: pnpm install / yarn install
```

**3) Env**
Copy sample env and fill values (API keys, etc.).

```bash
cp .env.sample .env.local
```

**4) Dev server**

```bash
npm run dev
# Next.js app on http://localhost:3000 (by default)
```

**5) Build & typecheck**

```bash
npm run build
npm run typecheck
```


## Branching & Commits
-------------------

**Branch names**
```bash
feat/<short-desc>
fix/<short-desc>
chore/<short-desc>
docs/<short-desc>
```

**Conventional Commits** (please use):

```bash
feat: add task priorities to today column
fix: correct overdue sorting when deadline passed
docs: update README with setup steps
chore: bump deps and refresh lockfile
refactor: extract board sorting utils
test: add unit tests for 3-3-3 method
```

Other types: perf, build, ci, style, revert.

## Coding Standards
----------------

*   **TypeScript** first. No implicit any.
    
*   Run **lint & format** before pushing:
    

```bash
npm run lint
npm run format
```
*   Keep functions small and pure where possible.

*   Prefer **React Server Components** or **app router** conventions if applicable.
    
*   Add/extend **JSDoc** or inline comments for non-obvious logic.
    
*   If you add external libs, justify them in the PR description.
    

## Testing
-------

*   If the repo has tests:
```bash
npm test
```  
*    Add tests for new logic (unit over integration when possible).

*    Don’t ship flaky tests. If something is non-deterministic, mock it.

_If the project currently lacks tests, start by adding a small test around what you changed._

## Pull Request Process
--------------------

1.  **Sync with upstream main**
```bash
git fetch upstream
git checkout main
git rebase upstream/main
```

2.  **Create a feature branch** (see naming above).
    
3.  **Keep PRs focused** (aim < ~300 lines diff if you can).
    
4.  **Checklist before opening PR**
    
    *   Feature/bug linked to an issue
        
    *   npm run lint passes
        
    *   npm run typecheck passes
        
    *   npm run build passes
        
    *   Tests added/updated (if applicable)
        
    *   Docs updated (README/inline comments)
        
5.  **PR description template**
    
    *   What & Why
        
    *   Screenshots/GIF for UI
        
    *   Breaking changes? Migration notes?
        
    *   Follow-ups / out of scope
        
6.  **Reviews**
    
    *   Be responsive to feedback; small iterative commits > giant rewrites.
        
    *   Squash commits on merge (preserves clean history).
        

## Issue Reporting
---------------

**Bug report checklist**

*   Repro steps (numbered)
    
*   Expected vs actual
    
*   Logs / screenshots
    
*   Env (OS, browser, Node version)
    
*   Minimal reproduction if possible
    

**Feature requests**

*   Problem statement (what’s painful now)
    
*   Proposed solution (API/UI sketch)
    
*   Alternatives considered
    
*   Impact (users, perf, DX)
    

## Security
--------

If you discover a vulnerability, **do not** open a public issue.
Email: omkarbalekundri77@gmail.com
We’ll acknowledge in 48–72 hours and work on a fix. See SECURITY.md for details.

## Releases
--------

*   Use **SemVer**: major.minor.patch
    
*   Add entries to CHANGELOG.md (Keep a Changelog style).
    
*   Tag releases: vX.Y.Z
    
*   Use GitHub Releases notes (auto-generated from Conventional Commits if possible).
    

## Community
---------

*   Discussions/Q&A can live in **GitHub Discussions**.
    
*   Labels: good first issue, help wanted are beginner-friendly.
    

## License
-------

By contributing, you agree your contributions are licensed under the repository’s **MIT License**.