## Eventual Consistency

At the core of Cloudant is an open-source database called [CouchDB](https://couchdb.apache.org/). Cloudant has extended CouchDB by adding many features, ranging from geospatial indexing to full-text search. Moreover, Cloudant made CouchDB an [eventually consistent](https://docs.cloudant.com/cap_theorem.html) database service.

Eventual Consistency describes the [consistency model](https://en.wikipedia.org/wiki/Consistency_model#Eventual_consistency) for data or state in a distributed system. In Cloudant's case, when the database service is provisioned, a cluster of servers (a.k.a.: *"nodes"*) are tasked to store data and respond to read/write requests. Cloudant is a distributed system.

In a distributed system, a user wants three guarantees of the data - **consistency**, **availability**, and **partition tolerance**. Partition tolerance refers to the ability of the system to continue to operate, despite network or host failure. *Consistency* implies that every host responding to a query for data will provide the identical response. *Availability* means the data is there when it is requested. However in failure states or concurrent operations, in a distributed system, the user must choose between consistency or availability of the data.

Eventual consistency is a stark difference to traditional RDBMS. RDBMSs' are generally configured to have *master-slave* replication. If the master node is unavailable, then writes are unavailable and consistency is preserved. In Cloudant, if a node fails, any other node can accept a write, thus the data  remains available for write operations.

In failure cases or concurrent operations, Cloudant is optimized for availability, whereas traditional RDBMSs are optimized for consistency. Cloudant's internal replication is near real-time (bounded by network latency), so inconsistency is an exception, not the rule. Inconsistencies arise during node failures in a cluster, or during race conditions (aka concurrent operations).  Inconsistencies are resolved by the use of Cloudant's [Multi-Version Concurrency Control](#multi-version-concurrency-control). Moreover, as a Database-as-a-Service, node failure in a Cloudant cluster is not exposed to the end-users of Cloudant.

### Internal Replication

[Eventual consistency](#eventual-consistency) implies that the database system maintains multiple copies of data. When data is sent to a Cloudant cluster, three (3) nodes in the cluster write the data to disk. Creating three copies of the data ensures the data remains highly available, even when one or more nodes in the cluster are unavailable.

When compared to a traditional RDBMS which may only store one copy of the latest version data, Cloudant stores 3 copies of the most recent versions of the data. By storing 3 versioned copies, this is analogous of maintaining two real-time backups of a traditional RDBMS.

A master-slave configuration of an RDBMS may achieve a similar assurance of having numerous copies of the data; however, it is ultimately limited in scale. Cloudant can scale data partitioning or operation effortlessly, whereas an RDBMS would become bounded or complex.

### Multi-Version Concurrency Control
> first revision of the document

```json
{
  "_id": "74b2be56045bed0c8c9d24b939000dbe",
  "_rev": "1-7438df87b632b312c53a08361a7c3299",
  "name": "Samsung Galaxy S4",
  "description": "",
  "price": 650
}
```

> second revision of the document

```json
{
  "_id": "74b2be56045bed0c8c9d24b939000dbe",
  "_rev": "2-61ae00e029d4f5edd2981841243ded13",
  "name": "Samsung Galaxy S4",
  "description": "Latest smartphone from Samsung",
  "price": 650
}
```

> also second revision, conflicts with the previous one

```json
{
  "_id": "74b2be56045bed0c8c9d24b939000dbe",
  "_rev": "2-f796915a291b37254f6df8f6f3389121",
  "name": "Samsung Galaxy S4",
  "description": "",
  "price": 600
}
```

The [internal replication](#internal-replication) uses a versioning tracking system called [*"Multi-Version Concurrency Control"*](https://docs.cloudant.com/mvcc.html)(aka *MVCC*) to track the changes in the data. This means that when a record is updated/mutated, the previous data is not removed until two conditions are met:

1. All nodes hosting the data agree about the latest version, there are no conflicts.
* The user configurable compaction process identifies old, stale versions of the data to be removed.

In a traditional RDBMS, an `UPDATE` operation mutates the data record and the previous values are discarded.  In Cloudant, the previous values are stored for a period of time, until a [*compaction process*](https://docs.cloudant.com/mvcc.html#revisions) occurs.

MVCC assigning a version number and an identifier of the node which incremented version number. This makes the causality of the data mutation is deterministic. When failures or concurrent write operations occur, then the multiple versions in conflict are presented to the application layer (or end-user) for [resolution](https://docs.cloudant.com/mvcc.html#distributed-databases-and-conflicts).  

<aside class='notice'>
An example can be seen to the right of the versions of a document.  More information about MVCC can be found on in <a href='https://docs.cloudant.com/mvcc.html'>Cloudant documentation</a>.
</aside>

By versioning data, the potential for data loss is mitigated, because Cloudant ensures the latest data has been replicated to three other hosts. If there is a conflict from a failure or concurrent mutation, no data is lost, and the choice is given to the end-user on how to [resolve conflicts](https://docs.cloudant.com/mvcc.html#how-to-resolve-conflicts).  

### Delete Tombstones

Data in Cloudant is not physically removed until a time and manner determined by an administrator, not an end-user or application. From the perspective of an application, when a `DELETE` operation is executed, the data document is removed. From the internal Cloudant perspective, the data record's version is incremented per [MVCC](#multi-version-concurrency-control) and marked as deleted. This is called a [Tombstone Document](https://docs.cloudant.com/document.html#'tombstone'-documents).

Tombstone documents are not deleted. The previous versions of the document will remain in the database until the compaction process occurs.  The tombstone document is ultimately used for replication purposes, to ensure the deleted version of the document is circulated to the other hosts of the data.

Tombstones documents make use of [MVCC](#multi-version-concurrency-control). Unlike RDBMS, data is deleted immediately and unrecoverable once deleted, unless restoring from a backup. Cloudant provides a window in which data is immediately recoverable, based on the compaction schedule.

The timeframe until the compaction process occurs is based on the throughput of the system.  Compaction can be adjusted in priority for Cloudant dedicated customers.  To adjust the compaction schedule, users with the `cluster admin` role must create a support request with the Cloudant support team.
> An example of a filter function to remove tombstone documents from a replication stream:

<aside class='success'>
To preserve deleted documents, configure replication with a <a href="https://docs.cloudant.com/document.html#'tombstone'-documents">filter function</a> to remove tombstone documents from replication to a backup database.
</aside>
