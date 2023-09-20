@ECHO OFF
SET /p migration="Enter migration name: "
dotnet ef migrations add AriesCloudDb_%migration% -c Yoma.Core.Infrastructure.AriesCloud.Context.AriesCloudDbContext -o Migrations
