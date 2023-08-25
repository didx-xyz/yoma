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
* [`rtx`](https://rtx.pub/) to install
  * [Dotnet](https://dotnet.microsoft.com/)
  * [Tilt](https://tilt.dev/)
  * [Node](https://nodejs.org/en/)
    * [Yarn](https://yarnpkg.com/)

### Recommended method to install tooling
This project uses [rtx](https://rtx.pub/) to manage various toolsets (Node, Dotnet, Tilt, etc)
* `rtx` is an [`asdf`](https://asdf-vm.com/) compatible Runtime Executor written in [Rust](https://www.rust-lang.org/)
* It's 20-200x faster than `asdf`

To install `rtx`, follow the instructions at [jdxcode/rtx-cli](https://github.com/jdxcode/rtx#installation).

Here's a few of the ways to install `rtx`
```sh
# Build from source
cargo install rtx-cli
# Download pre-compiled binary
curl https://rtx.pub/install.sh | sh
# Cargo Binstall
cargo install cargo-binstall
cargo binstall rtx-cli
# MacOS or you're using Homebrew
brew install jdxcode/tap/rtx
# MacPorts
sudo port install rtx
```
*`rtx` is **not** compatible with Windows - use WSL2.*

Once you've got `rtx` installed, you can install the required tooling by running `rtx install` in the project root.

To pull in the config (e.g: environment variables) set in `.rtx.toml` file, you'll need to run `rtx trust`

### Installing Git Hooks
This project uses [husky](https://typicode.github.io/husky/#/) to manage git hooks.

Once you've got `rtx` and `yarn` installed (`npm install -g yarn`) run `yarn install --frozen-lockfile` in the root of the project.

This will bootstrap `husky` and install the configured git hooks.
