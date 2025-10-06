@ECHO OFF
SET /p migration="Enter migration name: "
dotnet ef migrations add SubstackDb_%migration% -c Yoma.Core.Infrastructure.Substack.Context.SubstackDbContext -o Migrations
