###
# Builder
###
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build

WORKDIR /build
COPY ./src ./src
COPY Yoma.Core.sln .

RUN dotnet restore
RUN dotnet publish --output /api/ --configuration Release

###
# Runner
###
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runner

WORKDIR /api
COPY --from=build /api .
# Make an empty `wwwroot` directory to calm down Sentry/ASP.NET
RUN mkdir /api/wwwroot

EXPOSE 5000
CMD ["dotnet", "Yoma.Core.Api.dll"]
