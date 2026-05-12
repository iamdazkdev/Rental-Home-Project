# .ai/ — Single Source of Truth

> **CANONICAL SOURCE** cho toàn bộ AI agent configuration của **Rento**.
> Mọi chỉnh sửa rules, skills, agents, workflows đều thực hiện tại đây.
>
> `.agents/` và `.claude/rules|skills/` là symlinks — **KHÔNG edit trực tiếp**.

---

## Kiến trúc

```text
.ai/                          ← CANONICAL (edit here only)
├── README.md                 ← Bạn đang đọc
├── agents/                   ← Persona definitions (9 agents)
├── rules/                    ← Architecture & coding standards
│   ├── express/              ← Backend rules
│   ├── flutter/              ← Mobile rules
│   ├── react/                ← Frontend rules
│   └── shared/               ← Cross-platform (security, git, platform-router)
├── skills/                   ← Domain knowledge & code patterns
├── workflows/                ← Slash command workflows (26)
├── reflections/              ← Post-session learnings (_TEMPLATE.md)
├── scripts/sync.sh           ← Fallback copy khi symlink không hoạt động
├── hooks/                    ← Git hooks (optional)
└── prompts/                  ← Reusable prompt templates (optional)

.agents/                      ← Symlinks → .ai/ (Antigravity / Gemini đọc đây)
.claude/rules/                ← Symlinks → .ai/rules/shared/ (Claude Code đọc đây)
.claude/skills/               ← Symlinks → .ai/skills/ (Claude Code đọc đây)
```

**Khi symlinks không hoạt động** (Windows / một số CI):

```bash
bash .ai/scripts/sync.sh
```

---

## Khi nào dùng gì?

| Tôi muốn... | Dùng |
| --- | --- |
| Code Express backend | `agents/express-architect.md` + `rules/express/` + `skills/express-*/` |
| Code React frontend | `agents/react-architect.md` + `rules/react/` + `skills/react-*/` |
| Code Flutter mobile | `agents/flutter-architect.md` + `rules/flutter/` + `skills/flutter-*/` |
| Review bảo mật | `agents/security-officer.md` + `workflows/security-review.md` |
| QA / viết test | `agents/qa-engineer.md` + `workflows/tdd-*.md` |
| Quản lý DB / migration | `agents/database-admin.md` + `skills/express-database-migrations/` |
| CI/CD / deploy | `agents/devops-sre.md` + `skills/devops-ci-cd/` |
| Phân tích BA / feature | `agents/product-manager.md` + `docs/BUSINESS_ANALYSTS/` |
| Kiểm tra UI/UX | `agents/ui-ux-designer.md` + `skills/react-ui-tokens/` |

---

## Slash Commands → Workflow Files

### Backend (server/)
| Command | File |
| --- | --- |
| `/plan-server` | `workflows/plan-server.md` |
| `/tdd-server` | `workflows/tdd-server.md` |
| `/feature-server` | `workflows/feature-server.md` |
| `/review-server` | `workflows/review-server.md` |
| `/build-fix-server` | `workflows/build-fix-server.md` |
| `/analyze-server` | `workflows/analyze-server.md` |
| `/auto-server` | `workflows/auto-server.md` |

### Client (client/)
| Command | File |
| --- | --- |
| `/plan-client` | `workflows/plan-client.md` |
| `/tdd-client` | `workflows/tdd-client.md` |
| `/feature-client` | `workflows/feature-client.md` |
| `/review-client` | `workflows/review-client.md` |
| `/build-fix-client` | `workflows/build-fix-client.md` |
| `/analyze-client` | `workflows/analyze-client.md` |
| `/auto-client` | `workflows/auto-client.md` |

### Mobile (mobile/)
| Command | File |
| --- | --- |
| `/plan-mobile` | `workflows/plan-mobile.md` |
| `/tdd-mobile` | `workflows/tdd-mobile.md` |
| `/feature-mobile` | `workflows/feature-mobile.md` |
| `/review-mobile` | `workflows/review-mobile.md` |
| `/build-fix-mobile` | `workflows/build-fix-mobile.md` |
| `/analyze-mobile` | `workflows/analyze-mobile.md` |
| `/auto-mobile` | `workflows/auto-mobile.md` |

### Shared
| Command | File |
| --- | --- |
| `/security-scan` | `workflows/security-scan.md` |
| `/security-review` | `workflows/security-review.md` |
| `/refactor-clean` | `workflows/refactor-clean.md` |
| `/update-docs` | `workflows/update-docs.md` |

---

## Agents (9)

| Agent | File | Dùng khi |
| --- | --- | --- |
| Express Architect | `agents/express-architect.md` | Thiết kế / review backend API |
| React Architect | `agents/react-architect.md` | Thiết kế / review frontend |
| Flutter Architect | `agents/flutter-architect.md` | Thiết kế / review mobile |
| Security Officer | `agents/security-officer.md` | Audit bảo mật, pen test |
| QA Engineer | `agents/qa-engineer.md` | Viết test, review test quality |
| Product Manager | `agents/product-manager.md` | Phân tích BA, clarify requirements |
| Database Admin | `agents/database-admin.md` | Schema design, migration, index |
| DevOps SRE | `agents/devops-sre.md` | CI/CD, deploy, monitoring |
| UI/UX Designer | `agents/ui-ux-designer.md` | Kiểm tra design consistency, a11y |

---

## Skills (41) — Quick Index

### Express Backend
| Skill | Dùng cho |
| --- | --- |
| `express-api-design` | REST endpoint naming, response envelope, pagination |
| `express-auth` | JWT middleware, role-based access, route protection |
| `express-error-handling` | HttpError class, global handler, asyncWrapper |
| `express-mongoose-patterns` | Schema, indexes, population, transactions |
| `express-security-advanced` | Helmet, rate limiting, sanitization |
| `express-redis-queue` | BullMQ background jobs |
| `express-file-upload` | Multer, Cloudinary upload |
| `express-database-migrations` | Migration scripts, idempotent, batch |

### React Frontend
| Skill | Dùng cho |
| --- | --- |
| `react-ui-tokens` | MUI theme, màu sắc, spacing, breakpoints |
| `react-state-management` | Redux vs Zustand decision matrix |
| `react-api-patterns` | Axios instance, interceptors, service pattern |
| `react-performance` | memo, useCallback, useMemo, lazy loading |
| `react-error-boundaries` | ErrorBoundary component, fallback UI |
| `react-hook-form-patterns` | react-hook-form + Zod, multi-step form |
| `react-server-state-patterns` | RTK Query, caching, optimistic update |
| `e2e-playwright` | End-to-end testing flows |

### Flutter Mobile
| Skill | Dùng cho |
| --- | --- |
| `flutter-bloc-patterns` | Event/State sealed class, multi-BLoC |
| `flutter-clean-arch` | Layer boundaries, DI checklist |
| `flutter-navigation` | GoRouter, deep linking, BLoC integration |
| `flutter-ui-performance` | const, buildWhen, ListView.builder |
| `flutter-firebase-messaging` | Push notification, deep link payload |
| `flutter-local-storage` | FlutterSecureStorage, Hive, offline-first |
| `flutter-integration-test` | Integration test on real device |

### DevOps
| Skill | Dùng cho |
| --- | --- |
| `devops-ci-cd` | GitHub Actions pipeline, Flutter pipeline |

---

## Rules — Bắt buộc đọc trước khi code

| Platform | Rules Files |
| --- | --- |
| Backend | `rules/express/RULES.md` → `rules/express/express-architecture.md` |
| Frontend | `rules/react/RULES.md` → `rules/react/react-architecture.md` |
| Mobile | `rules/flutter/flutter-architecture.md` |
| All | `rules/shared/security.md` · `rules/shared/git-workflow.md` · `rules/shared/platform-router.md` |

---

## Workflow Modes

| Mode | Stops | Dùng khi |
| --- | --- | --- |
| `/feature-*` | 3 (Plan → TDD → Review) | Feature phức tạp, cần review từng bước |
| `/auto-*` | 1 (chỉ Plan) | Feature quen thuộc, muốn chạy nhanh |
| `/tdd-*` | 1 (sau RED) | Biết cần viết gì, chỉ cần TDD pipeline |
| `/review-*` | 0 | Trước khi commit — checklist tự động |

---

## Git Convention (bắt buộc)

```
<type>(<scope>): <subject>

type:  feat | fix | refactor | docs | test | chore | perf
scope: be-server | fe-web | fe-mob | shared
```

Chi tiết: `rules/shared/git-workflow.md`

---

## Platform Router (CRITICAL)

```
Đang làm server/  → PHẢI đọc rules/express/ + skills/express-*/
Đang làm client/  → PHẢI đọc rules/react/  + skills/react-*/
Đang làm mobile/  → PHẢI đọc rules/flutter/ + skills/flutter-*/

KHÔNG BAO GIỜ mix code giữa platforms trong 1 commit.
```
