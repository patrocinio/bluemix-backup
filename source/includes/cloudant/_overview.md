# Cloudant

Cloudant is not a traditional database, but rather a Database-as-a-Service (DBaaS). Moreover, Cloudant is not a relational database (aka RDBMS), but rather is a "NoSQL datastore". As a NoSQL DBaaS, Cloudant is a new paradigm when compared to a RDBMS, does not provide the ability to do backups.

<aside class='success'>
Cloudant has a beta release available, which enables Enterprise customers to create incremental backups. This feature is not available by default, and must be enabled. Read more at the <a href='https://docs.cloudant.com/backup-guide.html'>Cloudant's documentation site</a>.
</aside>

Cloudant's design and architecture optimize for durability and availability of data, large datasets, and operational simplicity.  With regards to "operational simplicity", Cloudant is designed to be resilient when facing server outages. Moreover, Cloudant makes use of three properties which insure the durability and availability of data:  

* [**Internal replication**](#internal-replication): data records are replicated to three different machines, ensuring the data is secure and available
* [**Multi-Version Concurrency Control**](#multi-version-concurrency-control): the causality of data mutation (ie: `UPDATE`) is deterministic and version conflicts are retained, and presented to the end user for resolution.
* [**Delete Tombstones**](#delete-tombstones): `DELETE` operations on a data document create an incremented version of the data, with no data in the current version.

The above are properties of an [**Eventually Consistent** database](#eventual-consistency). With an eventually consistent design, traditional backups are not necessary because of the internal replication. In an eventually consistent system, like Cloudant, there are three backups of the data at all times.

Eventual consistency does provide better guarantees of data durability and availability in a single datacenter than a RDBMS. With that said, in the event of failure of the whole datacenter, the best practice advises to use [replication for backups and disaster recovery](#backup-and-replication).
