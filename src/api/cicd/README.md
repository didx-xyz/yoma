# Yoma API Core CICD

## Running local development environment

### Local development stack (BE)

For the didx:me integration branch, follow the [local startup guide](../../../docs/work/active/YOM-1306-didxme-wallet-integration-wallet-lite/environment.md).
Prepare standalone mono and obtain ignored Yoma Local settings privately, then start mono before
Yoma. Local initialization prepares the integration automatically; application jobs still handle
participant provisioning and credential issuance. Mono remains outside this Compose project.

From `src/api`:

```powershell
docker compose up --build -d
docker compose logs -f didxme-init
docker compose ps -a
```

Wait for all initialization to complete. For VS debugging, stop only `yoma-api` and leave dependencies
running. Verify the host profile's database has its own migrations/seeds; sharing Local settings does
not imply sharing Compose data. Stop VS before restarting the API container.

Do not publish Local settings, credentials, platform access instructions or private security
configuration. Deployed preparation and secret delivery are SRE-owned, separate from Local init.

### Local development stack (BE +FE)
#### Start BE stack:
```
docker-compose up
```

#### Clone the FE repo and run the FE stack:
```
git clone git@github.com:didx-xyz/yoma-web-app-reboot.git
cd yoma-web-app-reboot
docker-compose up
```

### Useful docker-compose commands

#### Tear down and delete persisted DB volumes and containers:
```
docker-compose down -v --rmi all
```

#### Build:
```
docker-compose up --build
```

#### Build with no caching:
```
docker-compose up --build --no-cache
```

#### Build a specific image with no caching:
Change <image-name> to e.g., `sqlserver-init`
```
docker-compose build --no-cache <image-name>
```

# Yoma API Core Keycloak CaC

How to prepare user profile and realm exports for Keycloak CaC.

Sort json:
```
jq -S '.' realm-export.json > realm-export.json
```

Convert to yaml
```
yq eval -o=yaml '.' realm-export.json > realm-export.yaml
``````
