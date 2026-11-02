## Bombardier
* [coding-yogi/bombardier](https://github.com/coding-yogi/bombardier)
* [gamelife1314/rsb](https://github.com/gamelife1314/rsb)

### Installing Bombardier and RSB
First you'll need to have Rust installed
```bash
$ curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
```
Then you can install Bombardier/RSB
```bash
$ cargo install cargo-binstall
$ cargo binstall rsb
$ cargo install --git https://github.com/coding-yogi/bombardier.git --tag v1.1
```
You'll likely need to install [`pkg-config`](https://freedesktop.org/wiki/Software/pkg-config/) as well

### Using Bombardier
Bombardier is configured with the following files:
* `config.yaml` (required)
* `environment.yaml` (required)
* `scenarios.yaml` (required)
* `users.csv` (optional)

Edit the files as needed, generate the `users.csv` file, if needed, and then run Bombardier:
```bash
$ ./gen-csv.sh $count $register
$ export RUST_LOG=info; bombardier bombard -c config.yaml -s scenarios.yaml -e environment.yaml -d ./users.csv
```

### Using RSB
RSB is great if you just want to test a single endpoint.

For example, how many logins per second can we do with IDSv4?
```bash
$ rsb -d 100 -c 3 -m POST \
  'https://api.example.invalid/api/v1/auth/login' \
  -H=user-agent:rsb\
  --json-body '{
    "email": "TEST_USER@example.invalid",
    "password": "<TEST_PASSWORD>"
  }'
```
Or how many logins per second can we do with Keycloak?
```bash
$ rsb -d 100 -c 30 \
  'https://identity.example.invalid/realms/TEST_REALM/protocol/openid-connect/token' \
  -m POST \
  -H=user-agent:rsb \
  -H=content-type:application/x-www-form-urlencoded \
  --form=client_id:account \
  --form='client_secret:<TEST_CLIENT_SECRET>' \
  --form=username:test \
  --form='password:<TEST_PASSWORD>' \
  --form=grant_type:password
```
