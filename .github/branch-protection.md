# Branch Protection Rules

This document outlines the required branch protection rules for the VerifyNIN repository to ensure code security and quality.

## Main Branch Protection

### Required Settings for `main` branch:

1. **Require pull request reviews before merging**
   - Required number of reviewers: 2
   - Dismiss stale reviews when new commits are pushed: ✅
   - Require review from code owners: ✅
   - Restrict reviews to users with write access: ✅

2. **Require status checks to pass before merging**
   - Require branches to be up to date before merging: ✅
   - Required status checks:
     - `security-lint`
     - `dependency-scan`
     - `sast-scan`
     - `secret-scan`
     - `security-tests`
     - `license-check`

3. **Require conversation resolution before merging**: ✅

4. **Require signed commits**: ✅

5. **Require linear history**: ✅

6. **Include administrators**: ✅

7. **Restrict pushes that create files**: ✅
   - Restricted paths:
     - `.env`
     - `*.key`
     - `*.pem`
     - `*.p12`
     - `secrets/`

8. **Allow force pushes**: ❌

9. **Allow deletions**: ❌

## Develop Branch Protection

### Required Settings for `develop` branch:

1. **Require pull request reviews before merging**
   - Required number of reviewers: 1
   - Dismiss stale reviews when new commits are pushed: ✅

2. **Require status checks to pass before merging**
   - Required status checks:
     - `security-lint`
     - `dependency-scan`
     - `secret-scan`

3. **Require conversation resolution before merging**: ✅

4. **Allow force pushes**: ❌

## Feature Branch Naming Convention

All feature branches must follow this naming pattern:
- `feature/JIRA-123-short-description`
- `bugfix/JIRA-456-short-description`
- `hotfix/JIRA-789-short-description`
- `security/JIRA-101-short-description`

## Commit Message Requirements

All commits must follow the Conventional Commits specification:

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

### Types:
- `feat`: New feature
- `fix`: Bug fix
- `security`: Security-related changes
- `perf`: Performance improvements
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `style`: Code style changes
- `ci`: CI/CD changes
- `chore`: Maintenance tasks

### Security-specific commit requirements:
- All security-related commits must be signed
- Security commits require additional review from security team
- Breaking security changes require approval from security lead

## Code Review Requirements

### Security Review Checklist:
- [ ] No hardcoded secrets or credentials
- [ ] Input validation implemented
- [ ] Authentication and authorization checks
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting implemented
- [ ] Audit logging added
- [ ] Error handling doesn't leak sensitive information
- [ ] Dependencies are up to date and secure

### Performance Review Checklist:
- [ ] Database queries are optimized
- [ ] Proper indexing implemented
- [ ] Caching strategy considered
- [ ] Memory usage optimized
- [ ] No N+1 query problems

## Automated Security Checks

The following automated checks must pass before merge:

1. **Static Analysis Security Testing (SAST)**
   - CodeQL analysis
   - Semgrep security rules
   - ESLint security plugin

2. **Dependency Scanning**
   - npm audit
   - Snyk vulnerability scanning
   - License compliance check

3. **Secret Detection**
   - TruffleHog secret scanning
   - GitLeaks detection
   - Custom regex patterns

4. **Code Quality**
   - TypeScript strict mode
   - ESLint rules
   - Prettier formatting
   - Test coverage > 80%

## Emergency Procedures

### Hotfix Process:
1. Create hotfix branch from `main`
2. Implement minimal fix
3. Fast-track security review (1 reviewer minimum)
4. Deploy to staging for verification
5. Merge to `main` and `develop`
6. Tag release and deploy

### Security Incident Response:
1. Immediately revoke any exposed credentials
2. Create security incident branch
3. Implement fix with security team review
4. Coordinate with DevOps for deployment
5. Post-incident review and documentation

## Repository Settings

### General Security Settings:
- Private repository: ✅
- Vulnerability alerts: ✅
- Dependency graph: ✅
- Dependabot alerts: ✅
- Dependabot security updates: ✅
- Code scanning alerts: ✅
- Secret scanning alerts: ✅

### Access Control:
- Base permissions: Read
- Admin access: Security team + Tech leads only
- Write access: Core development team
- Triage access: QA team
- Outside collaborators: Not allowed

### Webhook Security:
- All webhooks must use HTTPS
- Webhook secrets must be configured
- IP allowlisting for critical webhooks

## Compliance Requirements

This repository must maintain compliance with:
- PCI DSS Level 1
- SOC 2 Type II
- ISO 27001
- GDPR/NDPR data protection requirements

## Monitoring and Alerting

Security alerts are sent to:
- Slack: #security-alerts
- Email: security-team@verifynin.ng
- PagerDuty: Critical security incidents

## Regular Security Tasks

### Weekly:
- Review dependency updates
- Check for new security advisories
- Update security documentation

### Monthly:
- Security architecture review
- Penetration testing results review
- Access control audit

### Quarterly:
- Full security assessment
- Compliance audit
- Security training updates