# Use multi-stage builds to keep the final image clean and small
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build

WORKDIR /build
COPY ./src ./src
COPY Yoma.Core.sln .

RUN dotnet restore

# Install dependencies
#RUN dotnet restore
#
#COPY ./src/application/Yoma.Core.Api .
RUN dotnet publish --output /api/ --configuration Release
#
## Second stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
#
## Install Chromium dependencies for Puppeteer
## clean up the apt cache by removing /var/lib/apt/lists reduces the image size
#RUN apt-get update && apt-get install -y xorg openbox libnss3 libasound2 tini && rm -rf /var/lib/apt/lists/*
#
WORKDIR /api
COPY --from=build /api .
#
## Add Tini to reap zombie chrome processes
## Ideally the application should be refactored to not require this
## i.e. it should handle killing the chrome process itself (killing it's children)
#ENTRYPOINT ["tini", "--"]
#
EXPOSE 5000
CMD ["dotnet", "Yoma.Core.Api.dll"]
#CMD ["dotnet", "./src/application/Yoma.Core.Api/bin/Debug/net7.0/Yoma.Core.Api.dll"]
