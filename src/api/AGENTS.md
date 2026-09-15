# AGENTS.md — Yoma API (`src/api`)

.NET API backend. Owner: **Adrian**. Root conventions in `/AGENTS.md` apply; this file adds API specifics.

## Layout

- `src/application/Yoma.Core.Api` — API host project (entry point)
- `src/domain/Yoma.Core.Domain` — business logic
- `src/infrastructure/Yoma.Core.Infrastructure.*` — integrations (Database, Keycloak, AmazonS3, SendGrid, Twilio, Zlto, etc.)
- `src/test/Yoma.Core.Test` — test project
- `migration/` — database migration scripts
- Solution file: `Yoma.Core.sln`

## Commands (run from `src/api/`)

```bash
dotnet restore
docker-compose up -d postgresql-yoma                  # from repo root: local database
dotnet run --project src/application/Yoma.Core.Api    # run the API
dotnet build Yoma.Core.sln
dotnet test src/test/Yoma.Core.Test
```

Note: the README's `dotnet run --project src/Yoma.Core.Api` path is outdated; use the path above.

Swagger: `https://localhost:5001/swagger`

## Conventions

- Follow the existing layered structure: controllers in Api, logic in Domain, external services behind Infrastructure interfaces.
- Database changes go through the established migration workflow in `migration/` — never edit the schema ad hoc.
- Local secrets live in `env.secrets` (never commit real values).
- New third-party integrations get their own `Yoma.Core.Infrastructure.<Name>` project, mirroring existing ones.
