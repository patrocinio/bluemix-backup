## Backup and Replication
<aside class='notice'>
The following documentation has been extended from its original form at the <a href='https://docs.cloudant.com/backup-guide-using-replication.html'>IBM Cloudant documentation site</a>
</aside>

Cloudant's replication provides the facility to create a database backup,
and store it on a Cloudant cluster. From a replicated cluster, it is possible to restore a specific data document or an entire database.

Cloudant has been designed ([eventually consistent, highly-available](#eventual-consistency)) so that backups for data redundancy is no longer necessary. Backups are still a good practice, but it is important to understand the purpose of the backup, in order to choose a backup strategy.

For example, if an application requires low latency, replication can be used multi-master configuration.  If low latency is not a concern, but application data must be highly available, then replication can be used for a warm-standby configuration.  If an application needs to meet regulatory requirements, replication can be used for point-in-time or incremental backups; however if a history of data documents needs to be stored for compliance purposes, it may be advantageous to use architect/design the application to store versions of documents.

In summary, it is important to consider the purpose of the backup in order to choose the strategy that will best meet the objective of the backup. Due to Cloudant's fundamental design choices, it is **highly unlikely** that a backup will be needed to recover an entire cluster. It is highly likely that the use case of your application will determine the backup strategy required.

### Full Backups and Point-in-Time

Full and point-in-time backups are trivial to create with replication. The method is to use Cloudant replication from the primary cluster to a secondary cluster. Once replication is complete, disable replication, note the point-in-time the database was created.

To create multiple point-in-time backups on a schedule, such as seven daily and four weekly, this would require significant disk space, especially if the dataset is large.

<aside class='success'>
Replication can be initiated through Cloudant's user interface.  More information can be found at <a href='https://docs.cloudant.com/replication_guide.html#how-do-i-initiate-replication-via-the-dashboard'> Cloudant's documentation</a>.
</aside>

### Incremental backups

<aside class='success'>
Cloudant has a beta release available, which enables Enterprise customers to create incremental backups. This feature is not available by default, and must be enabled. Read more at the <a href='https://docs.cloudant.com/backup-guide.html'>Cloudant's documentation site</a>.
</aside>

To create an incremental backup, a high-level description of the process is as follows:

1. Perform an initial backup of the entire database by using [replication](https://docs.cloudant.com/replication_guide.html).
* Schedule a job locally to backup the differences, or deltas, from the previous 24 hour period.

<aside class="warning">
You can configure a backup to trigger at regular intervals. However, each interval must be 24 hours or more.
In other words, you can run daily backups but not hourly backups.
</aside>

### Creating an incremental backup

Incremental backups save only the differences or 'deltas' between backups.
Every 24 hours, the source database is replicated to a target database.

Replication uses sequence values to identify the documents changed during the 24-hour period. The backup operation works by using replication to get and store a [checkpoint](https://docs.cloudant.com/replication_guide.html#checkpoints).

The backup operation creates the name from a combination of the date and the backup task name. This name makes it easier to identify checkpoints during the recovery or roll up process.

To create an incremental backup, perform the following steps:
<!-- TODO: Verify on Client Cluster -->

1.	Find the ID of the checkpoint document for the last replication. It is stored in the  `_replication_id` field of the replication document, found in the `_replicator` database.
2.	Open the checkpoint document at `/<database>/_local/<_replication_id>`, where `<_replication_id>` is the ID you found in the previous step, and `<database>` is the name of the source or the target database. The document usually exists on both databases but might only exist on one.
3.	Search for the `recorded_seq` field of the first element in the history array found in the checkpoint document.
4.	Start replicating to the new incremental backup database, setting the `since_seq` field in the replication document to the value of the `recorded_seq` field found in the previous step.

### Restoring a database

To restore a database from incremental backups, replicate each incremental backup to a new database, starting with the most recent increment. While it may be intuitive to start restoration from the oldest backup, this is not advised. Starting replication from the newest/latest incremental backup first is faster because updated documents are only written to the target database once. Any documents older than a copy already present in the new database are skipped.

### An example

This example shows how to:

-	Setup databases to use incremental backup.
-	Run a full backup.
-	Set up and run an incremental backup.
-	Restore a backup.

> Constants used in this guide

```
# save base URL and the content type in shell variables
$ url='https://<username>:<password>@<username>.cloudant.com'
$ ct='Content-Type: application-json'
```

In this example, the following assumptions are made:

1.  Only one backup is made for only one database;
* A full backup will be created on *Monday*
* An incremental backup will be created on *Tuesday*

`curl` and [`jq`](http://stedolan.github.io/jq/) commands to run these operations.  Other excellent tools are [`http-prompt`](https://github.com/eliangcs/http-prompt) and [HTTPie](https://httpie.org/).


#### Step 1: Check you have three databases

> Check you have three databases to use with this example

```shell
$ curl -X PUT "${url}/original"
$ curl -X PUT "${url}/backup-monday"
$ curl -X PUT "${url}/backup-tuesday"
```

For this example, three databases are required:

-	The original database, holding the canonical data to backup.
-	Two incremental databases, for Monday (`backup-monday`) and Tuesday (`backup-tuesday`).

#### Step 2: Create the `_replicator` database

> Create the `_replicator` database

```shell
$ curl -X PUT "${url}/_replicator"
```

If it does not exist, create the `_replicator` database.


#### Step 3: Back up the entire (original) database

> Run a full backup on Monday


```shell
$ curl -X PUT "${url}/_replicator/full-backup-monday" -H "$ct" -d @backup-monday.json
```
> `backup-monday.json` must contain the following:

```json
{
  "_id": "full-backup-monday",
  "source": "${url}/original",
  "target": "${url}/backup-monday"
}
```

On Monday, back up all data for the first time by using replication from the source `original` to target `backup-monday`.


#### Step 4: Get checkpoint ID

> Get checkpoint ID to help find the `recorded_seq` value:

```shell
$ replication_id=$(curl "${url}/_replicator/backup-monday" | jq -r '._replication_id')
```

On Tuesday do an incremental backup, rather than another full backup.

To start the incremental backup, two values are needed:

-	The checkpoint ID.
-	The `recorded_seq` value.

These values identify where the last backup ended, and determine where to start the next incremental backup. With these values it is possible to run the incremental backup.

Obtain the checkpoint ID value, which is stored in the `_replication_id` field of the replication document in the `_replicator` database.

#### Step 5: Get `recorded_seq` value

> Get `recorded_seq` from original database

```shell
$ recorded_seq=$(curl "${url}/original/_local/${replication_id}" | jq -r '.history[0].recorded_seq')
```

After obtaining the checkpoint ID, use the ID to get the `recorded_seq` value. This is found in the first element of the history array in the `/_local/${replication_id}` document, within the original database.

The last document replicated from the original database can be determined by  the `recorded_seq` value.

#### Step 6: Run an incremental backup

> Start Tuesday's incremental backup

```shell
$ curl -X PUT "${url}/_replicator/incr-backup-tuesday" -H "${ct}" -d @backup-tuesday.json
```
> where backup-tuesday.json contains the following:

```json
{
  "_id": "incr-backup-tuesday",
  "source": "${url}/original",
  "target": "${url}/backup-tuesday",
  "since_seq": "${recorded_seq}"
}
```

With the checkpoint ID and `recorded_seq`, the Tuesday's incremental backup can be initiated. This replicates all the document changes made _since_ the last replication.

Once the replication finishes, an incremental backup will be complete. The backup consists of all the documents in the original database, and may be restored by retrieving the content of both the `backup-monday` _and_ `backup-tuesday` databases.

#### Step 7: Restore the Monday backup

> Restore from the `backup-monday` database


```shell
$ curl -X PUT "${url}/_replicator/restore-monday" -H "$ct" -d @restore-monday.json
# where restore-monday.json contains the following:
```

```json
{
  "_id": "restore-monday",
  "source": "${url}/backup-monday",
  "target": "${url}/restore",
  "create-target": true  
}
```

To restore from a backup, replicate the initial full backup, and any incremental backups to a new database.

For example, to restore Monday's state, replicate from the `backup-monday` database.


#### Step 8: Restore the Tuesday backup

> Restore Tuesday's backup to get the latest changes first

```shell
$ curl -X PUT "${url}/_replicator/restore-tuesday" -H "$ct" -d @restore-tuesday.json
```
> `restore-tuesday.json` contains the following json document:

```json
{
  "_id": "restore-tuesday",
  "source": "${url}/backup-tuesday",
  "target": "${url}/restore",
  "create-target": true  
}
```

> Finish by restoring Monday's backup last

```shell
$ curl -X PUT "${url}/_replicator/restore-monday" -H "$ct" -d @restore-monday.json
```
> `restore-monday.json` contains the following json document:

```json
{
  "_id": "restore-monday",
  "source": "${url}/backup-monday",
  "target": "${url}/restore"
}
```

To restore Tuesday's database, first replicate from `backup-tuesday` and then from `backup-monday`.

It is possible to restore in chronological sequence; however, by using the reverse order, documents updated on Tuesday only need to be written to the target database once. Older versions of the document stored in the Monday database are ignored.

### Best practices

While the previous information outlines the basic incremental backup process,
each application has its own requirements and strategies for backups.
Here are a few best practices you might want to keep in mind.

#### Scheduling backups

Replication jobs can significantly increase the load on a cluster. If  backing up several databases, it is best to stagger the replication jobs for different times, or to a time when the cluster is less busy.

##### Changing the IO priority of a backup

> Setting the IO priority

```shell
X PUT "${url}/_replicator/io_priority" -H "$ct" -d @io_priority.json
```
> `io_priority.json` contains the following json document:

```json
{
  "source": {
    "url": "https://user:pass@example.com/db",
    "headers": {
      "x-cloudant-io-priority": "low"
    }
  },
  "target": {
    "url": "https://user:pass@example.net/db",
    "headers": {
      "x-cloudant-io-priority": "low"
    }
  }
}
```

> The response body will look like:

```json
{
  "ok":true,
  "id":"io_priority",
  "rev":"1-c3bc51284a2cc0ea0167178d23a8f553"
}
```

You can change the priority of backup jobs by adjusting the value of the `x-cloudant-io-priority` field within the replication document.

1.	In the source and target fields, change the `headers` object.
2.	In the headers object, change the `x-cloudant-io-priority` field value to `"low"`.

#### Backing up design documents

> Example Filter Function to remove Design Documents

```js
function(doc, req) {
  if (doc._id.indexOf('_design') != 0) {
    return false;
  }
  return true;
}
```

If you backup design documents, the backup operation creates indexes on the backup destination. This practice slows down the backup process and uses unnecessary amounts of disk space. If you don't require indexes on your backup system, use a [filter function](https://docs.cloudant.com/replication_guide.html#filtered-replication) with your replications to filter out design documents. You can also use this filter function to filter out other documents that are not required.

#### Backing up multiple databases

If your application uses one database per user, or allows each user to create several databases, you need to create a backup job for each new database.
<aside class='warning'>
Ensure that replication jobs do not begin at the same time.
</aside>

#### Local backups

Cloudant provides a full-featured software version of the Cloudant service, called Cloudant Local. Cloudant Local can be a source or target for replication and is configured in the same manner as [the service-based Cloudant replication.](https://docs.cloudant.com/replication_guide.html#how-do-i-initiate-replication-via-the-dashboard).  Proper configuration requires that Cloudant Local is connected to and is accessible to a network and has a route to and from the Cloudant service.

More information about Cloudant Local can be found at the [Cloudant Local documentation site.](https://www.ibm.com/support/knowledgecenter/SSTPQH_1.0.0/com.ibm.cloudant.local.install.doc/topics/clinstall_cloudant_local_overview.html)

#### Security Considerations 

<aside class='notice'>
The following documentation has been extended from its source, found in the <a href='https://docs.cloudant.com/replication_guide.html#permissions'> Permissions</a> and <a href='https://docs.cloudant.com/replication_guide.html#replication-pitfalls'>Pitfalls</a> section of the Replication Guide on the Cloudant documentation site.
</aside>

In order for replication to proceed optimally when replicating from database "a" to database "b", the credentials supplied must have:

*	`_reader` and `_replicator` rights on database "a".
*	`_writer` rights on database "b".

API keys are generated in the Cloudant Dashboard or [through the API](https://docs.cloudant.com/authorization.html#creating-api-keys).

Each key can be given individual rights relating to a specific Cloudant database. Cloudant must be able to write its checkpoint documents at the "read" end of replication, otherwise no state is saved and replication cannot resume from where it stopped. If the state is not saved, it can lead to performance problems when resuming replications of large data sets. The reason is that without checkpoints, the replication process restarts from the beginning each time it is resumed.

Admin access is required to insert a document into the `_replicator` database. The login credentials supplied in the source and target parameters do not require full admin rights. It is sufficient if the credentials are able to:

 * Write documents at the destination end.
 * Write checkpoint documents at both ends.

Cloudant has a special `_replicator` user permission. This allows checkpoint documents to be created, but does not allow the creation of ordinary documents in a database. It is recommended that you create API keys that have:

 * `_reader` and `_replicator` access at the source side.
 * `_writer` access at the destination side.
