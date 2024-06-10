# Yoma

Recommended tools:
* Your favorite IDE or Text Editor:
  * [Neovim](https://neovim.io/)
  * [VSCode](https://code.visualstudio.com/)
  * If you're experimental, there's always:
    * [Helix](https://helix-editor.com/)
    * [Cursor](https://www.cursor.so/)
    * [Zed](https://zed.dev/)
* [Docker](https://www.docker.com/)
* [`mise`](https://mise.jdx.dev/) to install
  * [Dotnet](https://dotnet.microsoft.com/)
  * [Tilt](https://tilt.dev/)
  * [Node](https://nodejs.org/en/)
    * [Yarn](https://yarnpkg.com/)

### Recommended method to install tooling
This project uses [mise](https://mise.jdx.dev/) to manage various toolsets (Node, Dotnet, Tilt, etc)
* `mise` is an [`asdf`](https://asdf-vm.com/) compatible Runtime Executor written in [Rust](https://www.rust-lang.org/)
* It's 20-200x faster than `asdf`

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
*`mise` is **not** compatible with Windows - use WSL2.*

Once you've got `mise` installed, you can install the required tooling by running `mise install` in the project root.

To pull in the config (e.g: environment variables) set in `.mise.toml` file, you'll need to run `mise trust`

### Installing Git Hooks
This project uses [husky](https://typicode.github.io/husky/#/) to manage git hooks.

Once you've got `mise` and `yarn` installed (`npm install -g yarn`) run `yarn install --frozen-lockfile` in the root of the project.

This will bootstrap `husky` and install the configured git hooks.

Trigger
