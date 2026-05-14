@ECHO OFF
SET /p migration="Enter migration name: "
dotnet ef migrations add AlisonDb_%migration% -c Yoma.Core.Infrastructure.Alison.Context.AlisonDbContext -o Migrations
