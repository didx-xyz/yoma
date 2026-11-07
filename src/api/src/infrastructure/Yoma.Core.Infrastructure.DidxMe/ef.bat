@ECHO OFF
SET /p migration="Enter migration name: "
dotnet ef migrations add ProviderDb_%migration% -c Yoma.Core.Infrastructure.DidxMe.Context.ProviderDbContext -o Migrations
