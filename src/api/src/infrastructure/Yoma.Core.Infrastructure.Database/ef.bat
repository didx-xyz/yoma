@ECHO OFF
SET /p migration="Enter migration name: "
dotnet ef migrations add ApplicationDb_%migration% -c Yoma.Core.Infrastructure.Database.Context.ApplicationDbContext -o Migrations

REM Scaffold conext from database
REM dotnet ef dbcontext scaffold '[ConnectionString]' Microsoft.EntityFrameworkCore.SqlServer -o Context
