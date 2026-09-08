@ECHO OFF
SET /p migration="Enter migration name: "
dotnet ef migrations add UmuziDb_%migration% -c Yoma.Core.Infrastructure.Umuzi.Context.UmuziDbContext -o Migrations
