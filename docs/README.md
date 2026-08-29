# Backend TWK Admin — Onboarding Documentation

Complete, self-contained documentation for the backend project. Read in this order as a **frontend
developer** and you will understand the whole codebase without asking a single question.

---

## Read These First

1. [00 - Project Startup Flow](00-project-startup-flow.md) — what happens on `npm run dev`.
2. [01 - Request Flow](01-request-flow.md) — how a request travels end-to-end.
3. [Frontend Developer Guide](frontend-developer-guide.md) — the whole backend explained for a React dev.
4. [Architecture](architecture.md) — layers and dependency rules (Clean Architecture + CQRS).
5. [Database](database.md) — MongoDB / Mongoose.

## Then Go Deep

| Topic | Docs |
| --- | --- |
| Folder-by-folder | [`folders/`](folders/src.md) |
| File-by-file & function-by-function | [`files/`](files/app.md) |
| CQRS (commands, queries, handlers) | [`cqrs/`](cqrs/index.md) |
| Every API endpoint | [`apis/`](apis/health-check.md) |
| Coverage validation (100%) | [`documentation-coverage.md`](documentation-coverage.md) |

---

## Documentation Coverage

Total documentation files: **99**
- Top-level — 7: `00-project-startup-flow.md`, `01-request-flow.md`, `architecture.md`,
  `database.md`, `frontend-developer-guide.md`, `documentation-coverage.md`, plus this `README.md`
- `folders/` — 7
- `files/` — 67 (one per source file; 100% file coverage verified path-for-path)
- `cqrs/` — 12
- `apis/` — 6
