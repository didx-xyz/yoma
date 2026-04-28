@ECHO OFF
SET /p migration="Enter migration name: "
dotnet ef migrations add JobbermanDb_%migration% -c Yoma.Core.Infrastructure.Jobberman.Context.JobbermanDbContext -o Migrations
