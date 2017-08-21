<!--- CLIENT SPECIFIC DATA --->
  [Login to Bluemix]: https://console.kpsj001.us-west.bluemix.net/

## Restore

Compose's user interface (UI) provides a method to to restore databases from  [*On-Demand*](#on-demand) or [*Scheduled*](#scheduled) backups. Restoring a database through Compose's UI is straight-forward, but does warrant a discussion with regards to best practices. Detailed below will are topics that should be understood before starting a backup and restore process.

### How Restore Works

To understand how to restore, it is important to understand [how backups are designed](#design). In short, for most deployments, backups are taken from a hidden cluster member, in which writes are halted and then the database files are archived from the filesystem into an object store.

In Compose, restoring from a backup creates a new deployment identical to the previous deployment. Compose will pull the data from the remote object store, place the archive files onto the filesystem, and then start the new database processes in the cluster. This restores the database to the point in time from when the backup was created.

Only `etcd` and `rethinkdb` are not restored with the original database files.  In these databases, [`etcdtool`](https://github.com/mickep76/etcdtool) and [`rethink restore`](https://rethinkdb.com/docs/backup/#restore) are used, respectively. This is an implementation detail and does not affect how users make use of Compose's restore functionality.

### Compose Restore Instructions

The following instructions are how to restore a deployment for a Bluemix dedicated application, generalized for all types of Compose database deployments.  

<aside class='warning'>
When using the Compose UI to restore a database, Compose will restore to a new deployment (see <a href='#how-restore-works'>How Restore Works</a>), which means using the default <code>VCAP_SERVICES</code> credentials <strong>may not be usable with the new deployment connection strings</strong>.  The application will need <a href='#user-provided-service-binding'>user-provided services</a>to access the new deployment connection string.
</aside>

1. [Login to Bluemix]
2. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.

![Bluemix: Services](images/compose/services.png)  
3. From the Compose service dashboard in Bluemix click the **Launch** button to get through the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
4. Select the deployment to access the Overview page, for example a MongoDB deployment

![Compose: MongoDB Overview](images/compose/backup/mongo/overview.png)  
5. From the Overview dashboard, select the `Backups` to view the archive of Scheduled and On-Demand backups.

![Compose: MongoDB Backups](images/compose/backup/backups.png)  
6. From the Backups view, there are two options, either download or restore.  In order to restore to a new deployment, click the Restore icon.

![Compose: Restore](images/compose/restore/mongo/restore.png)  
7. On the Restore view, deployment specific options (such as SSL or storage engines) will be displayed, as well as the target datacenter. Unless the location of the Bluemix application has changed, ensure the proper target datacenter is chosen.

<aside class='warning'>
Restoring to the wrong target location, such as a public cloud, could be a liability or risk for sensitive data.  Be careful!
</aside>

![Compose: Restore](images/compose/restore/mongo/restore2.png)  
8. Once the restore process is initiated, you will see the following notification. The time for the process to provision an new deployment is a function of the size of the previous database; however, because it is being restored from the database files from the filesystem, the restore process is generally quick.

![Compose: Restore Deployment](images/compose/restore/mongo/provisioning.png)  
9. Once the provisioning of the new deployment is complete, then go to the Overview dashboard and scroll to the connection information.  

<aside class='warning'>
If the application uses <code>VCAP_SERVICES</code> authentication, then the application will need to be reconfigured to use <a href='#user-provided-service-binding>user-provided services</a>.
</aside>
<aside class='warning'>
When an application uses SSL authentication, such as MongoDB or RethinkDB, then the application will need to be reconfigured to use a new SSL certificate. If the SSL certificate is read from the filesystem, add the new certificate and redeploy the application.  Otherwise, applications can use <a href='#user-provided-service-binding'>user-provided service bindings</a> to provide the certificate (and other credentials).
</aside>
![Compose: Overview](images/compose/backup/mongo/overview.png)

10. With the new deployment connection string, update the [user-provided services for the application](#user-provided-service-binding).

<aside class='warning'>
When adding user-provided services, all application instances will require to be restaged.
</aside>

#### Considerations

##### Authentication and Connections

The most important consideration when restoring a database, is how the application creates the connection - either through `VCAP_SERVICES` or user-defined environment variables. When a Compose service is created and bound to an application, many template applications make use of the default connection information in `VCAP_SERVICES`.  This becomes problematic when using the Compose database restore functionality, because of [how restore  works](#how-restore-works) by creating a new database deployment.

If the application makes use of default `VCAP_SERVICES`, then it is the best practice is to change the application to use user-provided service binding.  See [User Provided Service Binding](#user-provided-service-binding) for an example.

**Manually restoring a database should be avoided.**  See [the discussion below](#manual-restore-instructions) for more details.

##### Coordinating Restore over Multiple Database Deployments

The Compose Restore functionality can be thought of as a *"duplicate deployment"* functionality, as opposed to *"restore"* to a running database deployment.  Compose restores   Using the Compose Restore UI, it is not possible to restore multiple databases at once.  Additionally, the Compose API has been deprecated for use with any deployment.  It is only available for legacy deployments of a *"Classic MongoDB"* deployment.

##### Restoring Complete Compose Cluster (all deployments)

As an administrator, it is not possible to restore all Compose databases for a given Bluemix Dedicated Cloud. Database restores need to be executed on a per-application basis. This role and responsibility is the application owners in a Bluemix Dedicated Cloud. There is no UI or API available to cloud administrators to restore all databases.

<aside class='success'>
Compose automatically <a href="#scheduled">schedules backups </a> for all databases.
</aside>

**Manually restoring a database should be avoided.**  See [the discussion below](#manual-restore-instructions) for more details.

##### Failure

If a restore fails, the new database deployment will provide notice and the connection strings will not be available on the Overview dashboard.  If a failure occurs, the Compose team will be notified, however it is advised to submit a support ticket.

### Manual Restore Instructions

A manual database restoration is best suited for local development environments or a migration from a database deployment that is not in Compose.

<aside class='warning'>
When doing a manual restore to any Compose deployment the network latency may be an issue, depending on the size of the database.
</aside>

#### MongoDB
<aside class='notice'>
The MongoDB tools <code>mongorestore</code> or <code>mongodump</code> is required. For local development databases, MongoDB must also be installed.
</aside>

##### Using A Compose MongoDB Backup

Compose MongoDB backup files are not created with `mongodump`, instead they snapshots of the database files.  See [Backup Design](#design) for more information.

1. [Download a backup from a MongoDB deployment from Compose](#accessibility)
2. Decompress the tar archive
3. Start MongoDB locally with the database files:  
`monogod --dbpath /path/to/directory`

##### Using a Manual Backup

1. [Obtain a Manual backup](#mongodb)
2. [Follow the `mongorestore` instructions](https://docs.mongodb.com/manual/tutorial/backup-and-restore-tools/#basic-mongorestore-operations)

###### For a Compose deployment
While `mongorestore` is a well documented tool for Mongo database restoration, for production environments in Compose the best practice is to follow the [instructions for Compose Restore](#compose-restore-instructions).  If an application makes use of the `VCAP_SERVICES` connection strings, it may also make sense to create a new Compose service binding to your application and then use this method to restore the database.

<aside class='warning'>
These instructions could overwrite any data in an existing database and may or may experience network issues, depending the size of the database and the quality of the network route between client and server.
</aside>

1. [Login to Bluemix]
2. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.

![Bluemix: Services](images/compose/services.png)  
3. From the Compose service dashboard in Bluemix click the **Launch** button to get through the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
4. From the Compose service, select the target MongoDB deployment Overview dashboard, and obtain the connection information.

![Bluemix: Mongo Overview](images/compose/backup/mongo/overview.png)  
5. Execute the following command to restore to Compose-hosted MongoDB deployment:

`mongorestore --ssl --sslAllowInvalidCertificates -h sl-us-dal-9-portal.1.dblayer.com -p 10233 -d DBNAME -u USERNAME -pPASSWORD `

<aside class='notice'>
If the target database already contains the collections that are part of the dataset that will be restored, consider adding the <code>--drop</code> flag to <code>mongorestore</code>
</aside>

More about `mongorestore` can be found on [the MongoDB documentation](https://docs.mongodb.com/manual/reference/program/mongorestore/)

#### Postgres
<aside class='notice'>
The Postgres tools <code>psql</code> may be required. For local development databases, Postgres must also be installed.
</aside>

##### Using A Compose Postgres Backup

Compose Postgres backup files are not created with `pg_dump`, instead they `pg_basebackup`, which produces a set of data files which can be used to start Postgres. See [the Compose documentation](https://help.compose.com/docs/postgresql-faq#how-do-backups-work) and the [`pg_basebackup` documentation](https://www.postgresql.org/docs/9.1/static/app-pgbasebackup.html) for more information.

To install a Compose Backup on your local Postgres installation:  

1. [Download a backup from a Postgres deployment from Compose](#accessibility)
2. Decompress the tar archive
3. Follow [the instructions for a Point-In-Time-Recovery](https://www.postgresql.org/docs/9.1/static/continuous-archiving.html#BACKUP-PITR-RECOVERY)

##### Using a Manual Backup

For a local Postgres installation:

<aside class='notice'>
These instructions require having the <code>pg_restore</code> tool installed locally.
</aside>

1. [Obtain a Manual backup](#postgresql)
2. [Follow the `pg_restore` instructions](https://www.postgresql.org/docs/current/static/app-pgrestore.html)

###### For a Compose deployment
While `pg_restore` is a well documented tool for Postgres database restoration, for production environments in Compose the best practice is to follow the [instructions for Compose Restore](#compose-restore-instructions).  If an application makes use of the `VCAP_SERVICES` connection strings, it may also make sense to create a new Compose service binding to your application and then use this method to restore the database.

<aside class='warning'>
These instructions could overwrite any data in an existing database and may or may experience network issues, depending the size of the database and the quality of the network route between client and server.
</aside>

1. [Login to Bluemix]
2. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.

![Bluemix: Services](images/compose/services.png)  
3. From the Compose service dashboard in Bluemix click the **Launch** button to get through the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
4. From the Compose service, select the target Postgres deployment Overview dashboard, and obtain the connection information.

![Bluemix: Postgres Overview](images/compose/backup/postgres/overview.png)
5.  Use `pg_restore` with the connection strings provided by Compose. For example:

`pg_restore -d DBNAME -h <HOST NAME> -p 10109 -U admin /path/to/dump`


More about `pg_restore` can be found on [the Postgres documentation](https://www.postgresql.org/docs/current/static/app-pgrestore.html)


#### ElasticSearch
Elasticsearch does not provide a tool for dumping and restoring an Elasticsearch database. However, an tool called [`elasticdump`](https://www.npmjs.com/package/elasticdump) was provided by the open-source community. Its use requires that Node and NPM are installed.

Compose does provide the ability to download a backup an Elasticsearch cluster; however following the [Compose Restore Instructions](#compose-restore-instructions), it is possible to restore an Elasticsearch database in Compose.

##### Using a Manual Backup

###### For a local Elasticsearch installation:

<aside class='notice'>
These instructions require having the <code>elasticdump</code> tool installed locally.
</aside>

See the [Elasticsearch manual backup section for instructions on how to install `elasticdump`](#elasticsearch)

1. [Obtain a Manual backup](#elasticsearch) - *NOTE: It is possible to read from one Compose Elasticsearch deployment and into a local or remote elasticsearch host.*
2. [Follow the `elasticdump` instructions to restore](https://github.com/taskrabbit/elasticsearch-dump#standard-install).  For example:

`elasticdump --input=/path/to/elasticdump.json --output=https://USER:PASSWORD@<HOSTNAME>:10331 --type=data`

###### For a Compose deployment
For production environments in Compose, the best practice is to follow the [instructions for Compose Restore](#compose-restore-instructions).  

<aside class='warning'>
These instructions could overwrite any data in an existing database and may or may experience network issues, depending the size of the database and the quality of the network route between client and server.
</aside>

1. [Login to Bluemix]
2. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.

![Bluemix: Services](images/compose/services.png)  
3. From the Compose service dashboard in Bluemix click the **Launch** button to get through the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
4. From the Compose service, select the target Elasticsearch deployment Overview dashboard, and obtain the connection information.

![Bluemix: Elasticsearch Overview](images/compose/backup/elastic/overview.png)
5.  Use `elasticdump` with the connection strings provided by Compose. For example:

`elasticdump --input=https://USER1:PASSWORD1@<HOSTNAME>:10331 --output=https://USER2:PASSWORD2@<HOSTNAME>:10332 --type=data`

#### Redis
<aside class='notice'>
The Redis tool <code>redis-cli</code> or <code>mongodump</code> is required. For local development databases, MongoDB must also be installed.
</aside>

##### Using A Compose Redis Backup

Compose Redis backup files are created with `redis-cli` and dump the rdb file. These instructions can be used to create a `redis-server` for local development:

1. [Download a backup from a Redis deployment from Compose](#accessibility)
2. Decompress the tar archive
3. Start Redis locally with the database
4. Import the dump file:
<!-- TODO: Verify on Client Cloud> -->
`redis-server --dbfilename dump.rdb --dir .`

<aside class='notice'>
The <code>dbfilename</code> and <code>dir</code> can be set through the <code>redis-server</code> configuration file.
</aside>

##### Using a Manual Backup

The instructions for a Manual backup are identical to the Compose provided backup file, [mention directly above](#using-a-compose-redis-backup).

###### For a Compose deployment
Restoring a Compose Redis deployment for production environments in Compose should follow the best practice found in the [instructions for Compose Restore](#compose-restore-instructions).  If an application makes use of the `VCAP_SERVICES` connection strings, it may also make sense to create a new Compose service binding to your application and then use this method to restore the database.

<aside class='warning'>
These instructions could overwrite any data in an existing database and may or may experience network issues, depending the size of the database and the quality of the network route between client and server.
</aside>

1. [Login to Bluemix]
2. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.

![Bluemix: Services](images/compose/services.png)  
3. From the Compose service dashboard in Bluemix click the **Launch** button to get through the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
4. From the Compose service, select the target MongoDB deployment Overview dashboard, and obtain the connection information.

![Bluemix: Mongo Overview](images/compose/backup/redis/overview.png)
5. Execute the following command to restore to Compose-hosted Redis deployment:

`redis-cli -h <HOSTNAME> -p 14250 -a SAQABRBLMAPXPXFM --rdb dump.rdb`


<aside class='notice'>
If the target database already contains the collections that are part of the dataset that will be restored, consider adding the <code>--drop</code> flag to <code>mongorestore</code>
</aside>

More about `redis-cli` can be found on [the Redis documentation](http://redis.io/topics/rediscli)

#### RethinkDB
<aside class='notice'>
The Rethink database and CLI tool <code>rethinkdb</code> is required for local development databases.
</aside>

See the [RethinkDB backup section for more information](#rethinkdb).

All RethinkDB backup files are created with `rethinkdb dump` into a file. These instructions can be used to recreate a RethinkDB for local development or for a Compose RethinkDB deploymnet.

1. [Download a backup from a RethinkDB deployment from Compose](#accessibility)
2. Decompress the tar archive
3. Start Rethink locally with the database
4. Import the dump file using [`rethinkdb restore`](https://rethinkdb.com/docs/backup/#restore)
<!-- TODO: Verify on Client Cloud> -->
`rethinkdb restore DATAFILE`


##### For a Compose Deployment
<aside class='warning'>
These instructions could overwrite any data in an existing database and may or may experience network issues, depending the size of the database and the quality of the network route between client and server.
</aside>

1. [Login to Bluemix]
2. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.

![Bluemix: Services](images/compose/services.png)  
3. From the Compose service dashboard in Bluemix click the **Launch** button to get through the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
4. From the Compose service, select the target Rethink deployment Overview dashboard, and obtain the connection information.

![Bluemix: RethinkDB Overview](images/compose/backup/rethinkdb/overview.png)
5. Execute the following command to restore to Compose-hosted RethinkDB deployment:

`redis-rethinkdb restore rdb_dump.tar.gz --tls-cert compose.rethinkdb.crt -c <HOSTNAME>:39500`


More about `redis-cli` can be found on [the Redis documentation](https://rethinkdb.com/docs/backup/#restore)

#### Considerations
##### From Bluemix
It is not advised to store data in a Bluemix application. Doing so will likely require custom buildpacks and require coordination.  The only advantage is reducing network latency, however the data would still be required to be pushed to the application instance.  In short, avoid if possible.

##### Performance
The performance of a manual restore will vary greatly, depending on, but not limited to, database size, network latency, database type, etc. When possible, use Compose's restoration. It will be the fastest path to restoration.

<aside class='warning'>
A manual restoration of a database may not be able to complete, due to networking constraints.
</aside>

##### Failure
For any restore, whether the deployment is local or on Compose, the best practice is to restore to a fresh and clean database.  Moreover, every effort should be made to restore from Compose, to make use of the best practices and stable and reliable tooling previously implemented.

If a failure is encounter while manually importing a database, please contact support.

<aside class='warning'>
Due to myrid local environment configurations it may not be possible for support to resolve a restore issue. Use at your own risk.
</aside>

##### Coordinating Restoring Multiple Deployments

See [the discussion in the backup section of the documentation about coordinating a manual backup and restore across multiple databases.](#multiple-database-backup)

##### Restoring Complete Compose Cluster (all deployments)

As a system administrator, it is not possible to backup all database deployments in a Compose cluster, nor is it possible to restore all databases at once.  In a cloud environment, such as Bluemix Dedicated, the onus of restoring databases generally falls in the hands of the application owner.  
