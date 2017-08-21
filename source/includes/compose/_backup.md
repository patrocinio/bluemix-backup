<!--- CLIENT SPECIFIC DATA --->
  [Login to Bluemix]: https://console.kpsj001.us-west.bluemix.net/

## Backup

By default, the Compose DBaaS does [scheduled backups](#scheduled-backup) for every database deployment.

**Application Owners**  
As an application owner, scheduled backup does provide a safety net that will generally suffice for applications that make use of a single database. There are [use cases](#manual), such as an [application that uses multiple databases](#polyglot-persistence), that may necessitate backing up manually.  

**Bluemix Administrators**  
As an administrator of the Bluemix environment, Compose's [**Scheduled Backups](#scheduled) ensure that databases are being backed up without requiring additional administrative attention. There are occasions where a Bluemix Administrator may want to create a backup [**On Demand**] or have the need to capture a consistent state of the entire system. These topics are covered below.

### Design
Backups done by Compose were designed to minimize, or eliminate, any interruption to the database performance. To achieve this, backups are run against a non-active member of a deployment such that they will not be running against a node that serves queries.

For example, when a new Compose MongoDB deployment is created, part of the deployment is the addition of a full (but hidden) third member to the MongoDB replica set. The hidden member node is paused from accepting writes by sending it a `db.fsyncLock()` which flushes out all the pending write operations and locks the database.

<aside class='success'>
This lock is on the hidden member and will not impact the other cluster members.
</aside>
<!--- CLIENT SPECIFIC DATA --->
<!--
  > Kaiser Permanente uses the IBM Object Store (formerly Cleversafe) in Softlayer's Dallas09 datacenter, in lieu of a publicly hosted object store implementation
  -->

Once the `fsyncLock` is engaged, an OS operation copies the data files from the XFS filesystem and transmits the data files to an s3 compatible object store securely over https and encrypted at rest.

<aside class='notice'>
The default storage location that Compose uses is Amazon's S3.
</aside>

When this copy is completed, we send a `db.fsyncUnlock()` and release the hidden member. It then catches up with the replication state of cluster members and rapidly returns the replica set to complete consistency.

Compose keeps track of the backups through an internal database which holds on to the one [on-demand backup](#on-demand) and the [daily, weekly and monthly backup](#scheduled) sets. From that database, Compose serves backup metadata for archive location, timestamps, etc for download or into the data directory of a new deployment for a restore.

Compose stores the data files from the filesystem, rather than a dump, for all databases except `etcd` and `RethinkDB`.  This tactic ensures it is easier and faster to bring up an entire database.

Backup infrastructure is not exposed to any customer on any IBM platforms.

Elasticsearch, Postgres, and Redis all use strategy similar to stopping writes to a hidden member and capturing the data files, as how they reside on disk. RethinkDB and etcd use specific tools (ie: `rethinkdb dump` and `etcdtool`, respectively) that generate a JSON formatted backup file, rather than directly using the filesystem.  In all cases, the files created for backup are transmitted via HTTPS to be archived in an S3-compatible object storage.

### Security

Compose employees are granted access only to those systems and system features deemed necessary for the completion of their role as part of a "least required" access provisioning methodology. These access levels are reviewed regularly to ensure as roles change, access remains as limited as absolutely necessary.

Compose enlists the services of globally-recognized information security firms to assist in third-party security audits, recommendations in best practices, and application security guideline development. Please see Compose's [security documentation](https://help.compose.com/docs/security#section-disclosure-and-auditing) for further information.

#### Physical
<!--- CLIENT SPECIFIC DATA --->
<!--
  > For Kaiser Permanente, Compose databases are hosted in a dedicated environment  [SoftLayer's Dallas09 datacenter](http://www.softlayer.com/data-centers). Backups are hosted in a dedicated IBM Object Store (formerly Cleversafe) instance, also hosted in the SoftLayer Dallas09 datacenter.  
  SoftLayer Dallas09 datacenter uses Proximity badge and Biometric systems to secure physical access to the datacenter.  SoftLayer provides it's [most recent SOC 3 report](http://static.softlayer.com/sites/default/files/assets/page/softlayer-soc_3-103115.pdf). Further information can be found at the [SoftLayer compliance website](http://www.softlayer.com/compliance).
  -->

Compose hosts documentation regarding [Physical Security on the support website](https://help.compose.com/docs/security#section-physical-plant-controls)

#### Network
<!--- CLIENT SPECIFIC DATA --->
<!--
  > Kaiser Permanente's Compose hosted databases are only accessible from the Kaiser Permanente network with access to the `169.45.121.x` IP range.
  -->

Compose servers transmit backup data via an encrypted HTTPS using industry standard SSL/TLS *high* (>128-bit) encryption. Asymmetrical Key signatures are 2048-bit encryption and symmetrical connection encryption is 256-bit.

Data is never transmitted over a network that has visibility into adjacent user data. Compose utilizes network Access Control Lists as well as [802.1q VLAN](http://en.wikipedia.org/wiki/IEEE_802.1Q) segmentation to ensure each customer environment is entirely autonomous.

#### Filesystem/Storage
<!--- CLIENT SPECIFIC DATA --->
<!--
  > Kaiser Permanente backup data from Compose is stored in the IBM Object store on a 12-node storage cluster for redundancy.
  -->

All Compose database servers use the [XFS](http://xfs.org/index.php/XFS_FAQ) filesystem secured with [LUKS](https://gitlab.com/cryptsetup/cryptsetup/), the open source disk encryption software. Backups are encrypted and stored in an S3-compatible object store.

<aside class='notice'>
Further information about Compose's <a href='https://help.compose.com/docs/security#section-system-security'>systems security measures can be found on their website</a>.
</aside>


### Scheduled

When a new database system is created in Compose, this is referred to as a *"Deployment"*.  A database *deployment* can be one of:

* [MongoDB](https://www.compose.com/mongodb/)
* [ElasticSearch](https://www.compose.com/elasticsearch)
* [RethinkDB](https://www.compose.com/rethinkdb/)
* [Redis](https://www.compose.com/redis)
* [Postgres](https://www.compose.com/postgresql)

For every deployment, Compose will **automatically** backup every single deployment on a set schedule.

<aside class="warning">
Compose recently launched <a href="https://enterprise.compose.com/" alt="Compose Enterprise">Enterprise Clusters</a> targeted at applications in public clouds.  At the time of this writing, Enterprise Clusters is only available for Amazon Web Services and Google Cloud Platform. Enterprise Clusters are not necessary for Bluemix Dedicated Customers.
</aside>

<aside class='notice'>
There are several frequently asked questions about Compose backups can be found <a href='https://help.compose.com/docs/compose-backups'>on the Compose help website</a>
</aside>

#### Intervals

For each deployment, Compose will **automatically** schedule backup each deployment on a set schedule. The time of day when the backup operation runs is not configurable, nor is the backup data retention policy. No additional configuration is possible or required.

Schedule | Retention
-------- | ---------
Daily    | Last 7 daily backups
Weekly   | Last 4 weekly backups
Monthly  | Last 3 monthly backups

<aside class='notice'>
Please see <a href='https://help.compose.com/docs/compose-backups#changing-schedule-and-retention'>the Compose FAQ for more information about the Compose backup schedule and retention policy.</a>
</aside>

#### Accessibility

**Backup Dashboard**
Scheduled (and On-Demand) Backups are accessible through the Compose Backup dashboard.

To access the Compose Backup Dashboard:

1. [Login to Bluemix]
2. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.

![Bluemix: Services](images/compose/services.png)  
3. From the Compose service dashboard in Bluemix click the **Launch** button to get to the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
4. From the Compose Deployment view, click **Backups**, which is the first icon on the left-hand navigation.

![Compose: Backups](images/compose/backup/backups.png)  
5. From the Compose Backup dashboard, choose a backup to download by clicking the green icon to the right of the backup timestamp.

![Compose: Download](images/compose/backup/download.png)  

This will result in a tar file being streamed to you, named by the deployment name, timestamp, and backup type (ie: `daily`).

<aside class='warning'>
ElasticSearch backups are not available to download.
</aside>

<aside class='notice'>
<a href='https://help.compose.com/docs/compose-backups#how-do-compose-backups-work'>The Compose service ensures that deleted deployments automatically create a Deprovisioned Backup</a>; however these are only accessible by contacting support.
<br>
It is the best practice is to also <a href="#on-demand">create an On-Demand Backup</a>, <a href="#accessibility">download it</a> and archive locally before deleting a deployment.
</aside>

**API**

Accessing Backups via the API is only available for Classic MongoDB Deployments, which are not advised for production use.  The API will be deprecated in the future. Please see [API Support](#api-support) and [a blog post from August 2014](https://www.compose.com/articles/how-to-automatically-compose-your-backups/) for more information.

#### Failure

If an scheduled backup fails, the Compose service **will** notify the Compose support team; however, it **will not** notify the users associated with the account. Therefore, it is **highly recommended** that users of Compose  verify that scheduled backups are successfully.  Failed backups are rare, but are visible in the Backup view of a deployment.

#### Performance

Backups done by Compose were designed to minimized, or eliminate, any interruption to the database performance. To achieve this, backups are run against a non-active member of a deployment such that they will not be running against a node that serves queries. See the [Design section](#design) for details.

#### Locations
<!--- CLIENT SPECIFIC DATA --->
<!--
  >In Kaiser Permanente's dedicated Compose, all databases are hosted in [Softlayer's Dallas09 datacenter](http://www.softlayer.com/data-centers) and all backups are store in a IBM Object Store (formerly Cleversafe) instance dedicated to Kaiser Permanente, also located in Softlayer's Dallas09 datacenter.  
  -->

In a dedicated environment, Compose will store backups of database deployments in one of two possible locations:

1. By default, an Amazon S3 location closest to the dedicated deployment, OR
* By customer choice, an IBM Object Store location specified at the time of licensing.

<aside class='warning'>
At the time of this writing, IBM Object Store doesn't support encryption, so backups might not be encrypted if this option is selected.
</aside>

For those interested in learning about the public Compose datacenter availability, please see the [Compose help website](https://help.compose.com/docs/compose-datacenter-availability).

#### Data Types

Compose's Scheduled backups take file-system level snapshots of the database's data files (see [Design](#design)). Therefore, regardless of the datatype, the data will be captured by the Compose backup operation.

The notable exceptions are RethinkDB and etcd (see [Design](#design)), which only accept JSON documents (which are fundamentally strings), so the backup will contain all data stored.

##### Limitations

**Consistent Snapshot of Multiple Databases**
Compose does not have an interface to snapshot all databases at once. Coordination across multiple databases in a single application or across all Organizations in a dedicated Bluemix, is not possible through the Compose provided tools. This can be done [manually](#manual); however conducting backups from outside of Compose will likely negatively impact the database's performance.

**Multiple Account Visibility**
  At the time of this writing, it is not possible for an administrator to view all databases or status across all Compose accounts in a dedicated Compose environment. The Compose roadmap will likely add this feature in a future release.

### On Demand
In the case where an Bluemix Administrator or Application Owner needs to create a backup manually, the Compose web interface makes this possible through the click of a button.

<aside class='success'>
Despite the Compose Backup dashboard's statement that On-Demand Backups are limited to only 10 per week, <strong>this limitation has been removed</strong>.  The Compose Backup dashboard's content will be corrected.
</aside>

**Accessibility**  
On-Demand backups are accessible in the same manner as scheduled backups.  Please see [Scheduled Backup Accessibility section](#accessibility).

#### Instructions

1. [Login to Bluemix]
2. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.

![Bluemix: Services](images/compose/services.png)  
3. From the Compose service dashboard in Bluemix click the **Launch** button to get to the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
4. From the Compose Deployment view, click **Backups**, the first icon on them the left-hand navigation.

![Compose: Backups](images/compose/backup/backups.png)  
5. From the Compose Backup view, click the **Back up now** button

![Compose: Back up now](images/compose/backup/ondemand/backupnow.png)  
6. Compose will redirect to the Jobs view, with a notice saying **Performing Backup Now**

![Compose: Performing Job](images/compose/backup/ondemand/running.png)  
7. When the on-demand backup job completes successfully, the Jobs view will display the message **All operations have completed successfully**  with the date-time stamp.

![Compose: Complete](images/compose/backup/ondemand/complete.png)

##### Failure
When performing an **On-Demand Backup**, in rare circumstances the backup operation may fail.

![Compose: Backup Failure](images/compose/backup/ondemand/failure.png)  

In the case of a on-demand backup failure, the IBM Compose support team will be automatically notified.  Although Compose Support is notified, the best course of action is to open a new support ticket to track the failure.

<aside class="notice">
In the event of a failure, the Compose UI will display the failure, but will not send a notification to the users on the account.  For on-demand backups, always verify the backup completes successfully.
</aside>

#### Limitations

Backup jobs are serialized per deployment.  This means that only one (1) On-Demand backup job for a deployment can execute at a time. Issuing a request for a second backup job will cancel the first backup job.

### Manual

*"Manual backups"*, in the scope of this documentation, means using the database-vendor or open-source community supplied tools to *"dump"* data via network to a target location. The toolset likely include `mongodump`, `pg_dump`, `redis dump`, `etcdtool`, `elasticdump`, and `rethinkdb dump`. Additionally, this section of the documentation applies to any other tool that uses the database's APIs in order to backup.

Doing a manual backup from a Compose database is a calculated risk. Backing up manually may provide the end user of the database with more control; however it will comes at the cost of impacting the database's performance. This is because the accessible nodes are also responsible for responding to application requests as well.

<aside class='warning'
Creating a backup manually <b> will negatively impact performance.</b>
</aside>

#### Postgres

1. [Login to Bluemix]
2. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.

![Bluemix: Services](images/compose/services.png)  
3. From the Compose service dashboard in Bluemix click the **Launch** button to get to the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
4. From the Compose service, select the target deployment to access the Overview dashboard.  Note the administrator credentials and database name.

![Bluemix: Postgres](images/compose/backup/postgres/overview.png)
![Bluemix: Postgres](images/compose/backup/postgres/credentials.png)

##### Single Postgres Database
To create a back up of a single database, use the  [`pg_dump`](https://www.postgresql.org/docs/current/static/app-pgdump.html) tool on your localhost, execute the following command

<!--- CLIENT SPECIFIC DATA --->
<!--- TODO: ADD KP SPECIFIC EXAMPLE WHEN COMPOSE IS ACCESSIBLE --->
`pg_dump -U admin -h bluemix-test1-ibm-305.2.compose.direct -p 14047 -d exampledb > db.sql`

##### All Postgres Databases
To create a back up of all databases in a particular Postgres deployment, use the  [`pg_dumpall`](https://www.postgresql.org/docs/current/static/app-pg-dumpall.html) tool on your localhost, execute the following command:

<!--- CLIENT SPECIFIC DATA --->
<!--- TODO: ADD KP SPECIFIC EXAMPLE, WHEN COMPOSE IS ACCESSIBLE --->
`pg_dump -U admin -h bluemix-test1-ibm-305.2.compose.direct -p 14047 > db.out`


#### MongoDB

<aside class='warning'>
Manual backups of MongoDB should be used as a last resort, because backups will impact the performance of a running database.
</aside>

1. [Login to Bluemix]
2. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.

![Bluemix: Services](images/compose/services.png)  
3. From the Compose service dashboard in Bluemix click the **Launch** button to get to the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
4. From the Compose service, select the target MongoDB deployment to access the Overview dashboard.  

![Bluemix: Deployment Databases](images/compose/backup/mongo/databases.png)
5. Select a Mongo database and then select the `Users` view.

![Bluemix: Mongo Users](images/compose/backup/mongo/users.png)
6. Verify that you have an existing user with `readOnly`, `readWrite`, or `dbOwner`.  If not, add a user.

![Bluemix: Add Users](images/compose/backup/mongo/add_users.png)
7. With valid user credentials on your target database, follow the instructions using `mongodump` as described in MongoDB's [Back Up a Sharded Cluster with Database Dumps](https://docs.mongodb.com/manual/tutorial/backup-sharded-cluster-with-database-dumps/) documentation.

<aside class='notice'>
Compose operates MongoDB as a sharded cluster; thus <code>mongodump</code> will establish a connection to <code>mongos</code> nodes. More information   can be found at <a href="https://docs.mongodb.com/manual/tutorial/backup-sharded-cluster-with-database-dumps/">MongoDB's documentation</a>
</aside>

<aside class='warning'>
To capture a point-in-time backup from a sharded cluster you must stop all writes to the cluster. On a running production system, you can only capture an approximation of point-in-time snapshot.
</aside>

#### Elasticsearch

Elasticsearch does not provide a backup utility; however node.js community members created `elasticdump`.  In order to use `elasticdump`, you must have Node.JS and NPM installed.  Binaries for installing Node and NPM are available at [https://nodejs.org/download/release/latest/](https://nodejs.org/download/release/latest/).

1. [Install `elasticdump`](https://www.npmjs.com/package/elasticdump)

`npm install -g elasticdump`  
2. [Login to Bluemix]  
3. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.

![Bluemix: Services](images/compose/services.png)  
4. From the Compose service dashboard in Bluemix click the **Launch** button to get to the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
5. From the Compose service, select the target Elasticsearch deployment to access the Overview dashboard. Note the connection string  

![Bluemix: Elasticsearch Overview](images/compose/backup/elastic/overview.png)  
6. From the Overview page, select the `Users` view and confirm that you have a valid and current user credentials.  
7. In order for the `elasticdump` tool to create a backup of all indexes, the base URL must be specified as an `--input` and a directory for `--output`, as directed in the [MultiElasticDump section of the documentation.](https://github.com/taskrabbit/elasticsearch-dump#multielasticdump)

`elasticdump --input=https://admin:Passw0rd@sl-eu-lon-2-portal1.dblayer.com:10331/ --output=/tmp/`

#### Redis

<aside class='notice'>
In order to use the `redis-cli`, you must install <a href="http://redis.io/download">Redis to your localhost</a>.
</aside>

1. [Login to Bluemix]  
2. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.  

![Bluemix: Services](images/compose/services.png)  
3. From the Compose service dashboard in Bluemix click the **Launch** button to get to the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
4. From the Compose service, select the target Redis deployment to access the Overview dashboard.

![Bluemix: Redis Overview](images/compose/backup/redis/overview.png)  
5. Scroll down on the Overview dashboard until you reach the `Connection Info` section. Use these credentials with the `redis-cli` tool from your local host.

![Bluemix: Redis Credentials](images/compose/backup/redis/creds.png)  
6. From your local host execute the following command to create a remote backup of Redis

`redis-cli -h <CONNECTION> -p 14250 -a <PASSWORD> --rdb dump.rdb`

<aside class='notice'>
Interested users can learn more at the <a href='http://redis.io/topics/rediscli#remote-backups-of-rdb-files'>documentation for <code>redis-cli</code></a>.
</aside>


#### RethinkDB

<aside class='notice'>
RethinkDB, python, and the rethinkdb python client must be installed on your local host. For rethink installation instructions, see <a href='https://rethinkdb.com/docs/install/'>https://rethinkdb.com/docs/install/</a>.
<br>
The RethinkDB Python Client installation instructions are found at <a href='https://www.rethinkdb.com/docs/install-drivers/python/'>https://www.rethinkdb.com/docs/install-drivers/python/</a>.
</aside>

1. [Login to Bluemix]
2. On the Bluemix left-hand navigation, click the **Services** link and a specific Compose Service deployment.

![Bluemix: Services](images/compose/services.png)  
3. From the Compose service dashboard in Bluemix click the **Launch** button to get to the Compose dashboard.

![Bluemix: Launch](images/compose/launch.png)  
4. From the Compose service, select the target Rethink deployment to access the Overview dashboard.

![Compose: Rethink Overview](images/compose/backup/rethinkdb/overview.png)
5. From the Rethink Overview, scroll down to the `Connection Info` section and click `Show` and note the password. Then scroll down to the `SSL Certificate (Self-Signed)` section.

![Compose: Rethink SSL](images/compose/backup/rethinkdb/ssl.png)
6. Copy the contents of the SSL certificate to a file (ie: `compose.rethinkdb.crt`) on your local host

![Compose: SSL Certificate](images/compose/backup/rethinkdb/cert.png)
7. From your local host, execute the `rethinkdb dump` command with the host, port, `--tls-cert` and the `-p` (password) flags:

`rethinkdb dump -p --tls-cert compose.rethinkdb.crt -c sl-us-dal-9-portal.1.dblayer.com:10828`

Enter your password when prompted and a successful result will output something similar to the following:

`[========================================] 100%
9342 rows exported from 1 tables, with 0 secondary indexes
  Done (0.75 seconds)
Zipping export directory...
  Done (0 seconds)
`
#### From Bluemix

In theory, it is possible to be able to execute binary backup tools, such as `mongodump` or `pg_dump` from Bluemix. In practice, it can be a complex task, as it requires creating a custom buildpack to build the binary from source.  Additionally, the binary must be built with SSL/TLS support, since connecting to Compose requires an SSL certificate.  Due to the SSL requirement, the binary should be built with the openssl libraries from the Bluemix host, and not from any other host.

A backup from Bluemix may reduce the network latency from Compose in comparison to running backup commands from your local network; however, storing data on the filesystem of a Bluemix application is strongly discouraged and should be immediately stored in secure location, such as an object store.  Moreover, additional consideration will have to be given to coordination, if there are more than one application instances running of the backup process.

#### Multiple Database Backup

The primary reason to do manual backups of a Compose database, is to coordinate a backup across multiple database in order to preserve a consistent state.  The application architecture determines the complexity of making consistent backups across databases. A common technique to ensure a consistent backup across a distributed system is to make data immutable and versioned.

##### Immutability and Versioning
```javascript
// `crypto` provides the consistent hash
const crypto = require('crypto');
const hash = crypto.createHash('sha256');

// `mongoose` provides an Object Model for MongoDB
var mongoose = require('mongoose')
, Schema = mongoose.Schema

// Providing a model for version history of any object
, versionModel = new Schema({
  version: String,
  data: Schema.Types.Mixed
})
, Version = mongoose.model('Version', versionModel)

// An example object model
, userModel = new Schema({
    first_name:  String,
    middle_name: String,
    last_name:   String,
    role:        String,
    dob:         Date,
    version:     String,
    history:     [Version]
  })
, User = mongoose.model('User', userModel);

// Connect to Mongo
mongoose.connect(process.env.MONGO_URI, {
  user: process.env.MONGO_USER,
  pass: process.env.MONGO_PASS
});

// an example document to populate the object model
var user = {
  first_name: 'Sidney',
  middle_name: 'R.',
  last_name: 'Garfield',
  role: 'physician',
  dob: new Date(1906, 04, 17)
}
// crypto requires a string or buffer (ie: `json`)
, json = JSON.stringify(record)
, doc = new User(user)
, version = new Version({
  data: user,
// `hex` will marshall a string to fit `Version` schema
  version: hash.update(json).digest('hex')
});

// Saves the document with the version history and the latest version
doc.version = version.version;
doc.history.push(version);
doc.save();
```
```java
package com.ibm.immutability.example;

import com.mongodb.MongoClient;
import org.mongodb.morphia.Datastore;
// `Morphia` provides an Object Model for MongoDB
import org.mongodb.morphia.Morphia;
import org.mongodb.morphia.annotations.Entity;
import org.mongodb.morphia.annotations.Field;
import org.mongodb.morphia.annotations.Id;
import org.mongodb.morphia.annotations.Index;
import org.mongodb.morphia.annotations.Indexes;
import org.mongodb.morphia.annotations.Property;

import java.util.ArrayList;
import java.util.List;
// `java.security.MessageDigest` provides the consistent hash
import java.security.MessageDigest;
// JSON utils
import org.codehaus.jackson.JsonGenerationException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;



public final class ImmutabilityDemo {
  private ImmutabilityDemo(){
  }

  public static void main(final String[] args) {
    final Morphia morphia = new Morphia();

    // tell morphia where to find your classes
    // can be called multiple times with different packages or classes
    morphia.mapPackage("org.ibm.immutability.example");

    // create the Datastore connecting to the database running on the default port on the local host
    final Datastore datastore = morphia.createDatastore(new MongoClient(), "immutability_example");

    SimpleDateFormat ft = new SimpleDateFormat ("yyyy-MM-dd");
    Date dob;
    dob = ft.parse("1906-04-17");
    final User user = new User("Sidney", "R.", "Garfiled", "physician", dob);
    // an example document to populate the object model

    datastore.save(user);
  }  
}

// Provides an example User model object
@Entity("users")
class User {
  @Id
  private ObjectId id;
  private String firstName;
  private String middleName;
  private String lastName;
  private String role;
  private Date dob;
  private String version;
  @Reference
  private List<Version> history = new ArrayList<Version>();

  public User(
      final String firstName,
      final String middleName,
      final String lastName,
      final String role,
      final Date dob,
    ){
    this.firstName = firstName;
    this.middleName = middleName;
    this.lastName = lastName;
    this.role = role;
    this.dob = dob;

    final version = new Version(this);
    this.version = version.version;
    this.history.add(version);

    return this;
  }
}

// Provides a model for version history of a `User` object
@Entity("versions")
class Version {
  @Id
  private ObjectId id;
  private String version;
  @Reference
  private User data;

  public Version(final User user) {
    this.data = user;
    this.version = this.createVersionId();
  }

  private String createVersionId() {
    ObjectMapper mapper = new ObjectMapper();
    // Convert object to JSON string
    String json = mapper.writeValueAsString(this.data);

    MessageDigest md = MessageDigest.getInstance("SHA-256");
    md.update(json.getBytes("UTF-8"));
    byte[] digest = md.digest();
    String  versionString = String.format("%064x", new java.math.BigInteger(1, digest));

    return versionString;
  }
}
```

Immutability solves creating consistent backups, not by coordination, but by maintaining a version history of the state of a data object. While this optimizes for recoverability at the last known good state and high availability, the tradeoff is an additional use of disk space, as well as complexity created by maintaining a version history of a data object.

<aside class='success'>
A common workaround the increased disk usage is to use a bounded history size.
</aside>

It is **[near impossible](https://en.wikipedia.org/wiki/Clock_synchronization)** to coordinate database backups according to wall clock time, because of the complexity required to coordinate and synchronize all CPU clocks across multiple servers. Therefore, if the application has access to an array of versions, then the versions of data can be coordinated in the application layer, rather than relying on precise timing to capture state at a precise moment.

<aside class='warning'>
While immutability simplifies issues regarding managing state across multiple databases, it adds complexity to querying, updates, and operations.
</aside>

A frequently used technique is to use a consistent hashing algorithm with a low collision rate (ie: `SHA256`) to create a version identifier based on the contents of the data object. See the example on the right.

##### Halting Database Writes

If an application uses multiple databases and is not architected to use [versioning for data objects](#immutability-and-versioning), the best way to capture a consistent state across multiple databases is to halt writes to all databases.  This can be achieved by planning an outage for an application.  

An outage is a less-than-ideal solution if your application requires high-availability. To minimize the impact of halting writes to the databases, the application could be architected to take advantage of message queues (ie: MessageHub) and the [micro-services architectural pattern](https://www.redbooks.ibm.com/abstracts/sg248275.html). In this scenario, micro-services are created to accept writes for each database. These applications can be coordinated to stop accepting writes and take a snapshot of the database.

A message queue, such as MessageHub, could be used to fan data objects to the datastore micro-services. In this case, the queue can still accept the objects for writes, while the micro-services are halted for capturing consistent snapshots.

The addition of a caching micro-service, such as Redis, may allow your application to have a read-your-write consistency model for some services; however services requiring backup, such as an Elasticsearch full-text search service, would not have the latest dataset to query until writes to the service were restored.

#### Replication and Failover

Many of the open source databases vendors may provide replication products which are unsupported in Compose.  
