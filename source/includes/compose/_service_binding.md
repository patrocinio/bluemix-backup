## User Provided Service Binding

The examples below are for application owners and administrators. Each database in Compose has slightly different authentication scheme; however the schema of the JSON document for credentials in `VCAP_SERVICES` is arbitrary. Ultimately, the key/value pairs in a user-provided service are for the user to define and only relevant to the application that consumes the `VCAP_SERVICES` environment variables.

Below are examples for how to create and bind a user-provided service to an existing application. These directions can be used with any database deployment in Compose. Either the [Cloud Foundry](https://docs.cloudfoundry.org/cf-cli/install-go-cli.html) or [Bluemix](https://clis.ng.bluemix.net/ui/home.html) CLI is required, examples will be given for each.

### 1. Get DB credentials
Login to the Compose Dashboard, select the target MongoDB deployment, and on the Overview page, scroll down to the `Connection Info` section and obtain the appropriate credentials and SSL certificate.

![Compose: Overview](images/compose/backup/mongo/overview.png)

### 2. Create Credentials JSON
> `credentials.json`  

```json
{
"db_type": "mongodb",
"db_name": "<DB_NAME>",
"db_user": "<DB_USER>",
"db_pass": "<DB_PASS>",
"ca_certificate_base64": "[REDACTED]",
"uri": "mongodb://<USER>:<PASSWORD>@bluemix-sandbox-dal-9-portal.1.dblayer.com:15460/<DB_NAME>?ssl=true"
}
```

Create a valid JSON document with the appropriate key/value pairs for the credentials, based on how the application is configured to consume `VCAP_SERVICES`. Save the json document to your local filesystem.

### 3. Create Service
> Create a user-provided service with the Cloud Foundry CLI:

```shell
$ cf cups my-custom-service -p credentials.json
```

> Create a user-provided service with the Bluemix CLI:

```shell
$ bx service user-provided-create my-custom-service -p credentials.json
```
Using the `cf` or `bx` tool, create a new user-provided service.

### 4. Bind Service

  > Bind a user-provided service with the Cloud Foundry CLI

```shell
$ cf bs my-app my-custom-service
```

  > Bind a user-provided service with the Bluemix CLI

```shell
$ bx service bind my-app my-custom-service
```
Bind the newly created user-provided service to the application

### 5. Restage

  > Restage the application with the Cloud Foundry CLI

```shell
$ cf restage my-app
```

  > Restage the application with the Bluemix CLI

```shell
$ bx app restage my-app
```

Finally, simply `restage` the application
