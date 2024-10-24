# Keycloak Phone Provider

This is a custom Keycloak plugin for phone number registration and login. It has been forked from the [original project](https://github.com/cooperlyt/keycloak-phone-provider/tree/keycloak22.x.x) and updated to work with Keycloak version 22.0.1.

## Features

- Phone number registration
- Phone number login
- Customizable FreeMarker templates for phone number verification

## Authentication Flows

The following flows have been added to the realm import file (01-yoma-realm.yaml) and can be viewed in the admin console:

- **browserFlow**: Browser with phone
- **registrationFlow**: Registration with phone
- **resetCredentialsFlow**: Reset credentials with phone

## Customization

Any changes to the plugin code (Java) and FreeMaker templates require the JAR file to be rebuilt. Use the following command to build the JAR file:

```sh
mvn clean install
```
