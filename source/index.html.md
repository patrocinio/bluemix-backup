---
title: Backup & Restore Bluemix Dedicated Documentation

language_tabs:
  - javascript: Node
  - java: Java

includes:
  - compose/overview
  - compose/backup
  - compose/restore
  - compose/dr
  - compose/service_binding
#  - compose/support
  - compose/rto
  - cloudant/overview
  - cloudant/eventual_consistency
  - cloudant/replication
  - cloudant/rto
  - messagehub/overview

search: true
---
[Login to Bluemix]: https://console.bluemix.net/
 
# Overview

Welcome to the Backup & Restore documentation for Bluemix Dedicated. 

Not every service on Bluemix has a backup strategy because not every service manages data to be backed up.  What’s more, given the approach on Bluemix of letting each product operate in a way consistent with the standard operational principles of that underlying service, the backup and restore procedures for each can differ.  The following services have specific backup and restore or high availability procedures.

**DashDB** – For the DashDB Managed Service only, encrypted backups on the full database are done daily. The last two backups are retained. Point-in-time restores are not available.

**Apache Spark** – You can reuse an external SoftLayer Object Storage account in Apache Spark on Bluemix to store data redundantly.  Softlayer Object storage is highly available and replicated.

**DB2 on Cloud** -  DB2 on Cloud allows you to perform regular backups of your data to remote cloud storage  (IBM Softlayer Object Storage or Amazon S3) using the BACKUP command.

Some Bluemix services (such as the Time Series Database) do not have customer-accessible backup or restore procedures.  The backup and restore procedures of third-party services such as ElephantSQL are the responsibility of the service provider.
