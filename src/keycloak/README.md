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

For partners looking to implement Single Sign-On with Yoma:

- [SSO Integration Guide](../../docs/sso/README.md)

## 📚 Documentation

For more details on architecture, design decisions, and component guidelines, please refer to our [documentation](../../docs/README.md).
