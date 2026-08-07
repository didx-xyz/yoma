@ECHO OFF
SET /p migration="Enter migration name: "
dotnet ef migrations add IXOPartnerSyncDb_%migration% -c Yoma.Core.Infrastructure.IXO.PartnerSync.Context.IXOPartnerSyncDbContext -o Migrations
