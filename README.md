# 🌟 Yoma

Yoma is a comprehensive platform with multiple components working together to deliver a seamless experience for youth, organisations and administrators.

## 📚 Project Components

- [Web Frontend](./src/web/README.md) - NextJS 15 application providing the user interface
- [API Backend](./src/api/README.md) - .NET 9 API powering the platform
- [Keycloak Integration](./src/keycloak/README.md) - Authentication and authorization services

## 👥 User Roles

Yoma Web supports multiple user roles with tailored experiences:

- **Standard Users**: Access opportunities, manage profiles, and track achievements
- **Organization Admins**: Manage organization details, create and monitor opportunities, and review verifications
- **System Administrators**: Access maintenance and monitoring functions, manage platform settings, and oversee user management

## 🛠️ Development Setup

Recommended tools:

- Your favorite IDE or Text Editor:
  - [Neovim](https://neovim.io/)
  - [VSCode](https://code.visualstudio.com/)
  - If you're experimental, there's always:
    - [Helix](https://helix-editor.com/)
    - [Cursor](https://www.cursor.so/)
    - [Zed](https://zed.dev/)
- [Docker](https://www.docker.com/)
- [`mise`](https://mise.jdx.dev/) to install
  - [Dotnet](https://dotnet.microsoft.com/)
  - [Tilt](https://tilt.dev/)
  - [Node](https://nodejs.org/en/)
    - [Yarn](https://yarnpkg.com/)

### 📦 Recommended method to install tooling

This project uses [mise](https://mise.jdx.dev/) to manage various toolsets (Node, Dotnet, Tilt, etc)

- `mise` is an [`asdf`](https://asdf-vm.com/) compatible Runtime Executor written in [Rust](https://www.rust-lang.org/)
- It's 20-200x faster than `asdf`

To install `mise`, follow the instructions at [jdxcode/mise](https://mise.jdx.dev/getting-started.html).

Here's a few of the ways to install `mise`

```sh
# Build from source
cargo install mise
# Download pre-compiled binary
curl https://mise.jdx.dev/install.sh | sh
# Cargo Binstall
cargo install cargo-binstall
cargo binstall mise
# MacOS or you're using Homebrew
brew install mise
# MacPorts
sudo port install mise
```

_`mise` is compatible with Windows, but it is recommended to use WSL2 ([FAQ](https://mise.jdx.dev/faq.html#windows-support))._

Once you've got `mise` installed, you can install the required tooling by running `mise install` in the project root.

To pull in the config (e.g: environment variables) set in `.mise.toml` file, you'll need to run `mise trust`

### 🔄 Installing Git Hooks

This project uses [husky](https://typicode.github.io/husky/#/) to manage git hooks.

Once you've got `mise` and `yarn` installed (`npm install -g yarn`) run `yarn install --frozen-lockfile` in the root of the project.

This will bootstrap `husky` and install the configured git hooks.

## 📐 Other Documentation

- [SSO Integration Guide](./docs/sso/README.md) - Guide for partners to implement Single Sign-On
