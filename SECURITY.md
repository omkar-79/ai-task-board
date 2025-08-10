# Security Policy

We take security seriously and appreciate responsible disclosures that help keep users safe.

## 🔒 Reporting a Vulnerability

**Please do not open a public issue.**  
Use one of the private channels below:

1) **GitHub: Private Vulnerability Report** (preferred)  
   - Go to the repo’s **Security** tab → **Report a vulnerability**.

2) **Email**  
   - `<omkarbalekundri77@gmail.com>`  
   - Subject: `[SECURITY] <short description>`

Include:
- Affected version/commit SHA
- Environment (OS, Node.js version, browser)
- Steps to reproduce (PoC if possible)
- Impact assessment (data exposure, RCE, DoS, etc.)

We’ll acknowledge within **72 hours**, provide a status update in **5 business days**, and aim to fix within **30 days** (severity-dependent).

## 🔭 Scope

This policy covers:
- The `ai-task-board` application code in this repository
- Build/CI config that ships to users (e.g., GitHub Actions impacting releases)

Out of scope (still welcome as issues, not security reports):
- Typos, UI bugs, or general UX issues
- Denial-of-service via automated tooling without a specific exploit
- Vulnerabilities in **third-party services** (e.g., cloud providers, auth providers)

## ✅ Supported Versions

We typically patch the latest minor on the active major:

| Version | Supported |
|--------:|:---------:|
| v0.x    | ✅        |
| < v0.x  | ❌        |

> If we’ve tagged a stable release (v1+), we’ll document a longer support window here.

## 🔐 Disclosure & Coordination

- Please keep details **confidential** until a fix is released.
- We’ll assign a severity (CVSS-style) and coordinate a **coordinated disclosure** date.

## 🧪 Safe Harbor

We won’t pursue legal action for **good-faith** research that:
- Respects privacy and does not exfiltrate data
- Avoids service disruption or degradation
- Does not access, modify, or delete data you don’t own
- Stays within the scope above and follows this policy

If in doubt, ask first via the reporting channels.

## 🔁 Dependencies

- If the issue stems from a dependency (e.g., Next.js, React, Node), please report it upstream as well.
- We use automated alerts (e.g., Dependabot/CodeQL) and will bump versions promptly.

## 🔑 Secrets & Keys

- Never include real API keys or tokens in issues or PRs.
- If you accidentally commit a secret, **revoke it immediately** and open a private report with context.

## 🗂 Proof-of-Concept (PoC) Guidance

- Provide minimal reproducible steps (repo fork, diff, or script)
- If sharing a PoC exploit, sanitize any sensitive data and avoid publishing it publicly until fix release.

## 🏷 Credit & Hall of Fame

- With your consent, we’ll credit reporters in release notes.
- If you prefer to remain anonymous, just say so.

---

**Thanks for helping keep the community safe.**
