# 🔐 Yoma Keycloak Integration

Welcome to the Keycloak integration component of the Yoma platform! This module handles authentication, authorization, and user management for the entire system.

## 🌟 Overview

Keycloak provides a secure identity and access management solution for Yoma, supporting features like:

- Single Sign-On (SSO)
- Custom authentication flows
- Phone number authentication
- Theme customization

## � Directory Structure

The Keycloak component consists of the following key directories:

| Directory    | Description                                             |
| ------------ | ------------------------------------------------------- |
| `export/`    | Realm configuration exports and imports                 |
| `providers/` | Custom authentication providers and SPI implementations |
| `scripts/`   | Utility scripts for setup, backup, and maintenance      |
| `themes/`    | Custom UI themes and templates                          |

## 📱 Keycloak Phone Provider

This is a custom Keycloak plugin for phone number registration and login. It has been forked from the [original project](https://github.com/cooperlyt/keycloak-phone-provider/tree/keycloak22.x.x) and updated to work with Keycloak version 22.0.1.

### Features

- Phone number registration
- Phone number login
- Customizable FreeMarker templates for phone number verification

### Authentication Flows

The following flows have been added to the realm import file (01-yoma-realm.yaml) and can be viewed in the admin console:

- **browserFlow**: Browser with phone
- **registrationFlow**: Registration with phone
- **resetCredentialsFlow**: Reset credentials with phone

### Customization

Any changes to the plugin code (Java) and FreeMaker templates require the JAR file to be rebuilt. Use the following command to build the JAR file:

```sh
mvn clean install
```

## 🗂️ Export Configuration

The `export/` directory contains realm configuration files that can be imported into Keycloak. These exports capture:

- Client configurations
- User Federation settings
- Authentication flows
- Role mappings
- Required actions

To import a realm configuration:

```sh
./scripts/import-realm.sh
```

## 🧩 Custom Providers

The `providers/` directory contains custom extensions and SPI implementations:

- Phone authentication provider
- Custom user federation providers
- Event listeners

To deploy a custom provider:

1. Build the provider JAR
2. Copy it to the Keycloak providers directory
3. Restart Keycloak to load the new provider

## 🖌️ Themes Customization

The `themes/` directory contains custom UI themes for Keycloak:

- Login screens
- Account management pages
- Email templates
- Admin console customizations

To modify a theme:

1. Edit the files in the appropriate theme directory
2. Restart Keycloak or use hot-reloading (if enabled)
3. Select the theme in the Realm Settings

## 🛠️ Utility Scripts

The `scripts/` directory includes helpful utilities:

- Backup and restore scripts
- Realm import/export tools
- User migration helpers
- Health check monitors

Common script usage:

```sh
# Backup the current realm configuration
./scripts/backup-realm.sh

# Import a realm configuration
./scripts/import-realm.sh ./export/01-yoma-realm.yaml

# Check Keycloak status
./scripts/health-check.sh
```

## 🔑 Single Sign-On

### Local/Dev fixture users

`scripts/users.sh` is for test data after a **full reset**, not for managing existing users.
It uses Keycloak partial import with fixed GUIDs. These match `User.ExternalId` in
`src/api/cicd/scripts/postgressql-init/post.sql`; Yoma's own primary keys remain independent.
The normal user-creation API still generates IDs in Keycloak 26.8.1. Its
[partial-import implementation](https://github.com/keycloak/keycloak/blob/26.8.1/services/src/main/java/org/keycloak/partialimport/UsersPartialImport.java#L101)
preserves a supplied ID. The script imports credentials, profile attributes and roles together,
then reads each user back by that ID. It fails on import errors or conflicts without overwriting
existing identities. Passwords/tokens and HTTP response bodies are not printed.

| Fixture | Keycloak ID / Yoma ExternalId |
| --- | --- |
| testuser@gmail.com | `bed06c20-e8ce-45d8-b15c-26958c7c2721` |
| testadminuser@gmail.com | `5461f741-ef04-4875-8307-c896175d94d0` |
| testorgadminuser@gmail.com | `2a7f48c8-7dfe-41b6-9172-df47cc791303` |
| system@yoma.world | `419cde78-352d-4362-bacc-71b327ec984c` |

The three test users receive a synthetic `DateLastLogin` at SQL execution time in UTC.
The system user already comes from an application migration; the test seed updates its
ExternalId/modified values, leaving DateLastLogin unset because it does not sign in.
These GUIDs are fixture data only: runtime onboarding,
authentication and federation still use each user's normal persisted ExternalId.

Local Compose runs user import after `postgres-init`. Dev requires a separately provisioned seed job with the appropriate import permissions and ordering; SRE must review the existing deployment hook before using this revised script. Supply privileged configuration through the private SRE handoff. Runtime API permissions are not widened. Keep fixture usernames aligned with `post.sql`.

For VS's separate fixed PostgreSQL instance, run migrations and the same `post.sql` against
the empty database. The fixed ExternalIds then match the shared, freshly seeded Yoma Keycloak
without depending on its creation webhooks reaching that separate database.

Offline validation on Linux with Python, sh and jq:

```sh
FIXTURE_POST_SQL=src/api/cicd/scripts/postgressql-init/post.sql python3 src/keycloak/scripts/test_users.py
```

For partners looking to implement Single Sign-On with Yoma:

- [SSO Integration Guide](../../docs/sso/README.md)

## 📚 Documentation

### didx:me integration

Yoma's existing realm import owns its side of the integration. Local Compose applies it during
normal initialization; the standalone platform is managed separately. See the
[public startup guide](../../docs/work/active/YOM-1306-didxme-wallet-integration-wallet-lite/environment.md).

SRE supplies deployed configuration, permissions and secrets through the approved private handoff.
Do not document private platform trust settings, privileged workflows or access details here.

For more details on architecture, design decisions, and component guidelines, please refer to our [documentation](../../docs/README.md).
