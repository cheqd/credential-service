# Credential Service

[![GitHub release (latest by date)](https://img.shields.io/github/v/release/cheqd/credential-service?color=green&label=stable%20release&style=flat-square)](https://github.com/cheqd/credential-service/releases/latest) ![GitHub Release Date](https://img.shields.io/github/release-date/cheqd/credential-service?color=green&style=flat-square) [![GitHub license](https://img.shields.io/github/license/cheqd/credential-service?color=blue&style=flat-square)](https://github.com/cheqd/credential-service/blob/main/LICENSE)

[![GitHub release (latest by date including pre-releases)](https://img.shields.io/github/v/release/cheqd/credential-service?include_prereleases&label=dev%20release&style=flat-square)](https://github.com/cheqd/credential-service/releases/) ![GitHub commits since latest release (by date)](https://img.shields.io/github/commits-since/cheqd/credential-service/latest?style=flat-square) [![GitHub contributors](https://img.shields.io/github/contributors/cheqd/credential-service?label=contributors%20%E2%9D%A4%EF%B8%8F&style=flat-square)](https://github.com/cheqd/credential-service/graphs/contributors)

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/cheqd/credential-service/dispatch.yml?label=workflows&style=flat-square)](https://github.com/cheqd/credential-service/actions/workflows/dispatch.yml) [![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/cheqd/credential-service/codeql.yml?label=CodeQL&style=flat-square)](https://github.com/cheqd/credential-service/actions/workflows/codeql.yml) ![GitHub repo size](https://img.shields.io/github/repo-size/cheqd/credential-service?style=flat-square)

## ℹ️ Overview

The purpose of this service is to issue and verify credentials. This service by itself does not take care of storing the credentials. If you'd like to store credentials, you would have to pair this service with [secret-box-service](https://github.com/cheqd/secret-box-service.git). This service is also dependent on [auth0-service](https://github.com/cheqd/auth0-service)

## 📖 Usage

We run hosted endpoints for this package (in case you don't want to run it yourself) which have Swagger / OpenAPI definition endpoints that list all of the APIs and how they work.

The Swagger API definition pages are:

- [Production / Stable Release APIs](https://credential-service.cheqd.net/swagger/)
- [Staging / Development Release APIs](https://credential-service-staging.cheqd.net/swagger/)

## 🔧 Configuration

The application allows configuring the following parameters using environment variables.

### Core configuration

#### Network API endpoints

1. `MAINNET_RPC_URL`: RPC endpoint for cheqd mainnet (Default: `https://rpc.cheqd.net:443`).
2. `TESTNET_RPC_URL`: RPC endpoint for cheqd testnet (Default: `https://rpc.cheqd.network:443`).
3. `RESOLVER_URL`: API endpoint for a [DID Resolver](https://github.com/cheqd/did-resolver) endpoint that supports `did:cheqd` (Default: `https://resolver.cheqd.net/1.0/identifiers/`).
4. `APPLICATION_BASE_URL`: URL of the application (external domain name).
5. `CORS_ALLOWED_ORIGINS`: CORS allowed origins used in the app.

#### Veramo KMS Database

The application supports two modes in which keys are managed: either just storing them in-memory while a container is running, or persisting them in a PostgresSQL database with Veramo SDK. Using an external Postgres database allows for "custodian" mode where identity and cheqd/Cosmos keys can be offloaded by client applications to be stored in the database.

By default, `ENABLE_EXTERNAL_DB` is set to off/`false`. To enable external Veramo KMS database, set `ENABLE_EXTERNAL_DB` to `true`, then define below environment variables in `.env` file:

1. `EXTERNAL_DB_CONNECTION_URL`: PostgreSQL database connection URL, e.g. `postgres://<user>:<password>@<host>:<port>/<database>`.
2. `EXTERNAL_DB_ENCRYPTION_KEY`: Secret key used to encrypt the Veramo key-specific database tables. This adds a layer of protection by not storing the database in plaintext.
3. `EXTERNAL_DB_CERTIFICATE`: Custom CA certificate required to connect to the database (optional).

#### API Authentication using LogTo

By default, the application has API authentication disabled (which can be changed in configuration). If, however, you'd like to run the app with API authentication features, the following variables need to be configured.

We use a self-hosted version of [LogTo](https://logto.io/), which supports OpenID Connect. Theoretically, these values could also be replaced with [LogTo Cloud](http://cloud.logto.io/) or any other OpenID Connect identity provider.

By default, `ENABLE_AUTHENTICATION` is set to off/`false`. To enable external Veramo KMS database, set `ENABLE_AUTHENTICATION` to `true`, then define below environment variables in `.env` file:

1. **Endpoints**
   1. `LOGTO_ENDPOINT`: API endpoint for LogTo server
   2. `LOGTO_DEFAULT_RESOURCE_URL`: Root of API resources in this application to be guarded. (Default: `http://localhost:3000/api` on localhost.)
   3. `LOGTO_MANAGEMENT_API`: URL of management API for LogTo (default is `https://default.logto.app/api`)
   4. `CORS_ALLOWED_ORIGINS`: CORS allowed origins used in the app
2. **User-facing APIs**
   1. `LOGTO_APP_ID`: Application ID for the Credential Service application in LogTo. This can be set up as type "Traditional Web"
   2. `LOGTO_APP_SECRET`: Application secret associated with App ID above.
3. **Machine-to-machine backend APIs**
   1. `LOGTO_M2M_APP_ID`: Application ID for machine-to-machine application in LogTo. This is used for elevated management APIs within LogTo.
   2. `LOGTO_M2M_APP_SECRET`: Application secret
4. **Default role update using [LogTo webhooks](https://docs.logto.io/next/docs/recipes/webhooks/)**: LogTo supports webhooks to fire of requests to an API when it detects certain actions/changes. If you want to  automatically assign a role to users, a webhook is recommended to be setup for firing off whenever there's a new account created, or a new sign-in.
   1. `LOGTO_DEFAULT_ROLE_ID`: LogTo Role ID for the default role to put new users into.
   2. `LOGTO_WEBHOOK_SECRET`: Webhook secret to authenticate incoming webhook requests from LogTo.
5. **Miscellaneous**
   1. `DEFAULT_CUSTOMER_ID`: Customer/user in LogTo to use for unauthenticated users
   2. `COOKIE_SECRET`: Secret for cookie encryption.

#### Faucet settings

This section describes bootstrapping things for newcomers accounts. If it's enabled the CredentialService auto-populates some tokens on the testnet for making the process simpler.

1. `FAUCET_ENABLED` - enable/disable such functionality (`false` by default)
2. `FAUCET_URI` - URI when the faucet service is located (`https://faucet-api.cheqd.network/credit` by default)
3. `FAUCET_DENOM` - the denom of token to assign (`ncheq` by default)

### 3rd Party Connectors

The app supports 3rd party connectors for credential storage and delivery.

#### Verida

The app's [Verida Network](https://www.verida.network/) connector can be enabled to deliver generated credentials to Verida Wallet.

By default, `ENABLE_VERIDA_CONNECTOR` is set to off/`false`. To enable external Veramo KMS database, set `ENABLE_VERIDA_CONNECTOR` to `true`, then define below environment variables in `.env` file:

1. `VERIDA_NETWORK`: Verida Network type to connect to. (Default: `testnet`)
2. `VERIDA_PRIVATE_KEY`: Secret key for Verida Network API.
3. `POLYGON_PRIVATE_KEY`: Secret key for Polygon Network.

## 🧑‍💻🛠 Developer Guide

### Run as standalone application using Docker Compose

If you want to run the application without any external databases or dependent services, we provide [a Docker Compose file](docker/no-external-db/docker-compose-no-db.yml) to spin up a standalone service.

```bash
docker compose -f docker/no-external-db/docker-compose-no-db.yml up --detach
```

This standalone service uses an in-memory database with no persistence, and therefore is recommended only if you're managing key/secret storage separately.

The [`no-db.env` file](docker/no-external-db/no-db.env) in the same folder contains all the environment variables necessary to configure the service. (See section *Configuration* above.)

### Run with external Key Management System (KMS) and/or authentication service using Docker Compose

Construct the postgres URL and configure the env variables mentioned above.

Spinning up a Docker container from the [pre-built credential-service Docker image on Github](https://github.com/cheqd/credential-service/pkgs/container/credential-service) is as simple as the command below:

#### Configure PostgreSQL database

Configure the environment variables in the [`postgres.env` file](docker/with-external-db/postgres.env):

1. `POSTGRES_USER`: Username for Postgres database
2. `POSTGRES_PASSWORD`: Password for Postgres database
3. `POSTGRES_MULTIPLE_DATABASES`: Database names for multiple databases in the same cluster, e.g.: `"app,logto"`. This sets up multiple databases in the same cluster, which can be used independently for External Veramo KMS or LogTo service.

Then, make the Postgres initialisation scripts executable:

```bash
chmod +x docker/with-external-db/pg-init-scripts/create-multiple-postgresql-databases.sh
```

#### Start LogTo service

Configure the environment variables in the [`logto.env` file](docker/with-external-db/logto.env) with the settings described in section above.

Then, run the LogTo service to configure the LogTo application API resources, applications, sign-in experiences, roles etc using Docker Compose:

```bash
docker compose -f docker/with-external-db/docker-compose-with-db.yml --profile logto up --detach
```

Configuring LogTo is outside the scope of this guide, and we recommend reading [LogTo documentation](https://docs.logto.io/) to familiarise yourself.

#### Start credential-service app

Configure the environment variables in the [`with-db.env` file](docker/with-external-db/with-db.env) with the settings described in section above. Depending on whether you are using external Veramo KMS only, LogTo only, or both you will need to have previously provisioned these services as there are environment variables in this file that originate from Postgres/LogTo.

Then, start the service using Docker Compose:

```bash
docker compose -f docker/with-external-db/docker-compose-with-db.yml up --detach
```

#### Running app or LogTo migrations

When upgrading either the external Veramo KMS or LogTo, you might need to run migrations for the underlying databases.

You can run *just* the migration scripts using [Docker Compose profiles](https://docs.docker.com/compose/profiles/) defined in the Compose file.

For example, to run Credential Service app migrations on an existing Postgres database (for external Veramo KMS):

```bash
docker compose -f docker/with-external-db/docker-compose-with-db.yml --profile app-setup up --detach
```

Or to run LogTo migrations on an existing Postgres database:

```bash
docker compose -f docker/with-external-db/docker-compose-with-db.yml --profile logto-setup up --detach
```

### Build using Docker

To build your own image using Docker, use the [Dockerfile](docker/Dockerfile) provided.

```bash
docker build --file docker/Dockerfile --target runner . --tag credential-service:local
```

## 🐞 Bug reports & 🤔 feature requests

If you notice anything not behaving how you expected, or would like to make a suggestion / request for a new feature, please create a [**new issue**](https://github.com/cheqd/credential-service/issues/new/choose) and let us know.

## 💬 Community

The [**cheqd Community Slack**](http://cheqd.link/join-cheqd-slack) is our primary chat channel for the open-source community, software developers, and node operators.

Please reach out to us there for discussions, help, and feedback on the project.

## 🙋 Find us elsewhere

[![Telegram](https://img.shields.io/badge/Telegram-2CA5E0?style=for-the-badge\&logo=telegram\&logoColor=white)](https://t.me/cheqd) [![Discord](https://img.shields.io/badge/Discord-7289DA?style=for-the-badge\&logo=discord\&logoColor=white)](http://cheqd.link/discord-github) [![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge\&logo=twitter\&logoColor=white)](https://twitter.com/intent/follow?screen\_name=cheqd\_io) [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge\&logo=linkedin\&logoColor=white)](http://cheqd.link/linkedin) [![Slack](https://img.shields.io/badge/Slack-4A154B?style=for-the-badge\&logo=slack\&logoColor=white)](http://cheqd.link/join-cheqd-slack) [![Medium](https://img.shields.io/badge/Medium-12100E?style=for-the-badge\&logo=medium\&logoColor=white)](https://blog.cheqd.io) [![YouTube](https://img.shields.io/badge/YouTube-FF0000?style=for-the-badge\&logo=youtube\&logoColor=white)](https://www.youtube.com/channel/UCBUGvvH6t3BAYo5u41hJPzw/)
