# API business-behaviour tests

Keep this project independent of running applications, databases, Redis and provider accounts.

- Test business decisions, validation, mapping, state transitions and observable results.
- Mock repositories, provider clients and other dependencies. Use fresh in-memory inputs per test; never build inputs by reading migrations or production configuration.
- Assert behaviour, not implementation shape: no migration ordering, latest-migration names, SQL/source snapshots or reflected inventories of methods and attributes.
- Tests must run on every invocation: no environment-variable gates, external credentials or skipped integration probes.
- Retain meaningful business assertions when a fixture mixes them with development diagnostics. Remove only the diagnostics and their unused setup.

`Core/Fixtures` and `SSI/Fixtures` contain controlled catalogue inputs, not copies that must match future database seeds. Change them only when the scenario under test needs different inputs.

The feed-cache adapter currently requires a concrete EF execution-strategy service. Its tests use an unconnected provider context solely to construct that strategy; all data access is mocked. No database is opened.

From `src/api`:

```powershell
dotnet build src/test/Yoma.Core.Test/Yoma.Core.Test.csproj
dotnet src/test/Yoma.Core.Test/bin/Debug/net10.0/Yoma.Core.Test.dll -noLogo -reporter quiet
```

Temporary SQL, migration, provider and load investigations belong outside this retained unit suite. Record useful evidence in the relevant work handoff; do not leave an environment-dependent release gate behind.
