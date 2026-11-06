# Architecture Decision Records

One entry per decision that shapes the codebase. Newest last.

---

## ADR-001 — PostgreSQL + Prisma instead of a document database

**Status:** Accepted

**Context.** The domain is relational: a device belongs to at most one employee, and so does a desk on a floor map.
The first prototype of this app linked them by employee _name_, which forced manual cascades on rename and delete,
double existence checks around every assignment and transactions to keep everything consistent.

**Decision.** PostgreSQL accessed through Prisma 7 (driver adapter `@prisma/adapter-pg`). Relations use foreign keys
by id. The floor map grid (walls, labels) is stored as `text[]` and `jsonb`; placed objects get their own table.

**Rationale.** Foreign keys turn the old cascade code into a single `ON DELETE SET NULL`; uniqueness and integrity
rules live in the database where they can't be bypassed by a race.

**Consequences.** Prisma types stay inside `infrastructure/persistence`; repositories map rows to domain aggregates.
Switching engine again would only touch that folder.

---

## ADR-002 — Device status is derived, not stored

**Status:** Accepted

**Context.** Storing `status` next to `employee_id` allows impossible combinations (`in_use` with no employee,
`available` with one) that every write path must remember to prevent.

**Decision.** Only `decommissioned_at` is persisted. Status is derived: decommissioned if that date is set, `in_use`
if there is an employee, `available` otherwise. A `CHECK` constraint forbids a decommissioned device being assigned.

**Rationale.** Deleting an employee frees their devices and desks automatically (`ON DELETE SET NULL`) and the
derived status stays correct with no extra code.

**Consequences.** Assignment is a conditional update (`employee_id IS NULL AND decommissioned_at IS NULL`), so two
concurrent assignments can't both win. Filtering by status translates to conditions on those two columns.

---

## ADR-003 — pnpm monorepo with a shared HTTP contract

**Status:** Accepted

**Context.** API and web app evolve together and must agree on request and response shapes.

**Decision.** One repository: `apps/api`, `apps/web` and `packages/contracts`. The contract package holds only Zod
schemas and their inferred types — no business logic. The API validates input with them; the web app reads types
from them.

**Rationale.** Both apps depend on an abstraction instead of on each other. A breaking change in a request shape
fails the type check of both apps in the same commit.

**Consequences.** Domain rules are duplicated on purpose: the schema answers "is this well-formed?", the aggregate
answers "is this allowed?". Workspace packages are read from their TypeScript sources through a `source` export
condition in development and tests, and from `dist/` in production.

---

## ADR-004 — Clean Architecture by module

**Status:** Accepted

**Context.** The prototype mixed HTTP, SQL and rules in the same route handlers, and its biggest files passed
900 lines.

**Decision.** Each business module (`employees`, `devices`, `floor-maps`) has exactly three layers: `domain`
(aggregates and ports), `application` (one folder per use case) and `infrastructure` (`persistence` and `api`).
Modules never import each other: a module that needs another one's data declares its own port (for example
`IEmployeeLookup`). Entry points live in `src/apps/` (`http`, `seed`). Files hold at most 200 lines (300 for tests),
enforced in CI.

**Rationale.** Use cases can be tested with in-memory adapters and reused from another entry point (the seed script
already does). The line limit keeps every file readable at a glance.

**Consequences.** Classes live in PascalCase files named after the class; function modules use kebab-case.
Import aliases are Node subpath imports (`#modules/*`, `#shared/*`, `#apps/*`), which need no bundler or runtime
alias library.

---

## ADR-005 — No authentication in the public demo

**Status:** Accepted

**Context.** This is a portfolio project: reviewers should be able to try it without creating an account.

**Decision.** No login. Protection comes from a global rate limit (300 requests per minute per IP, trusting only the
configured number of proxy hops), strict input limits in the contract, and a daily reset of the demo database with
fictional data (`pnpm --filter api seed`, guarded by `ALLOW_DATA_RESET=true`).

**Rationale.** Anything a visitor breaks is restored the next day; no personal data is ever stored.

**Consequences.** The app must not be deployed with real data as is. Adding authentication would be a new
`preHandler` per route plus an identity module; the use cases don't change.

---

## ADR-006 — Optimistic locking for the floor map layout

**Status:** Accepted

**Context.** The editor autosaves the whole layout. Two open tabs would silently overwrite each other, and a stale
autosave could undo a desk assignment made elsewhere.

**Decision.** Every layout save carries the `version` it was based on and only applies if the stored version still
matches (then it increments). A mismatch answers `409 Conflict` and the client reloads. Desk assignments travel on
their own endpoint and are never part of a layout save.

**Rationale.** A single conditional update is the lock: no retries, no long transactions held by the client.

**Consequences.** Renaming a map or assigning a desk doesn't bump the version; only layout saves do.
