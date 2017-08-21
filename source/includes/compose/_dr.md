## Disaster Recovery Runbook
This documentation is to assist the IT administrators and application owners administrating applications on an IBM Bluemix Dedicated environment during a unplanned outage of the Compose Service.

<aside class='warning'>
<strong>DISCLAIMER:</strong> Every outage is unique. This documentation is generalized to fit most scenarios and consideration must be given to each step in the context of the outage.
<br>
The time to complete each step below are only an estimation and will likely vary widely depending on the outage.
</aside>

### Roles and Responsibilities

* **Client Application Owners** - end-users that are the stakeholders with deployed applications on the Bluemix and Compose platforms. Application owners are responsible for configuring their applications with credentials and hostnames.
* **Client IT Administrators** - coordinates communication and incident management between the client and IBM's support teams. Client IT administrators may be required to adjust any egress network connectivity that may be required to reach the cluster(s) as they will have different IP addresses.
* **Bluemix Support** - provides communication to the client on current status, concerns and issues.
* **Compose Support** - provides incident response and management for the Compose service. Compose is responsible for standing up hosts, preparing backup data for restore, and loading data as necessary into new database instances deployed on the new cluster.
* **Bluemix Operations** - provides incident response and management for the Bluemix platform. Responsible for service broker deployment.
* **Softlayer Operations** - provides infrastructure support to Bluemix Support, Bluemix Operations, and Compose Support.

### Disaster Recovery Outline

#### 1. Incident
The Compose service is no longer accessible from the Bluemix Environment. Application monitoring may begin to raise alerts to Client Application Owners and/or Client IT Administrators. Compose receives notifications from monitors about outage.


#### 2. Submit Support Ticket
Client IT Administrators submit a **Severity 1** support ticket with the Bluemix Dedicated Support team through the Bluemix administrative interface. The time to create and submit the support ticket will depend largely on the Client IT Administrators.


#### 3. Support Response
The Bluemix Support team will initiate coordinating incident management and  response with Compose Support team and Client IT Administrators. The Bluemix Support team will make the best effort to response as soon as possible. The Service Level Objective (SLO) for Severity 1 response times is 1 hour.

#### 4. Outage Identification
The Compose Support and Bluemix Operations team determine the Compose cluster is not fixable within the current data center.

#### 5. Deployment Identification/Confirmation
> The Cloud Foundry CLI command to unbind services

```shell
$ cf unbind-service APP_NAME COMPOSE_SERVICE_INSTANCE
```
> Or the Bluemix CLI

```shell
$ bx service unbind APP_NAME SERVICE_INSTANCE
```

The Compose Support team determines affected database deployments. The identified deployments are confirmed with the Client IT Administrators. The time objective is 10 minutes.


#### 6. Unbind Compose Services from Impacted Applications

The Bluemix Support team would advise the Client IT Administrators to unbind the existing Compose services from applications. The Client IT Administrators should notify the Application Owners to unbind the Compose service from their respective applications. The time objective should be 10 minutes per application.

#### 7. Disaster Recover Site Infrastructure Deployment

The Compose Support requests that SoftLayer provisions the required server hardware at the new datacenter. The time objective is 1 hour.

#### 8. Compose Services Deployment

The Compose Support team initiates the deployment and configuration of the Compose services on the provisioned hardware. The time objective is 1 hour.

#### 9. Network Configuration

The Compose Support team provides IP addresses and network configuration for the VPN to the Bluemix Operations team. The time objective is 10 minutes.

#### 10. Service Broker Update

The Bluemix Operations team configures a new service broker in the Bluemix Dedicated environment to the new Compose cluster deployed at the new datacenter. The time objective is 30 minutes.

#### 11. Database Deployment Restore

The Compose Support team initiates restore function for database deployments identified in the affected datacenter. Time variable per deployment instance. The recovery time objective for each database may take between 30 minutes and 2 hours to restore depending on data size, index size, and configuration. The recovery point objective is within the last 24 hours, based on the last available backup.

#### 12. Service Broker Confirmation

The Compose Support and Bluemix Operations team verify the updated service broker is properly configured and functional. The time objective is 10 minutes.

#### 13. Service Binding

The Client Application Owners and/or Client IT Administrators create user-provided services in Bluemix for each application. [Please see the User Provide Service instructions](#user-provided-service-binding). The time objective is less than 10 minutes per application.

#### 14. Application Recovery

> To restart an application using the Cloud Foundry CLI

```shell
$ cf restage APP_NAME
```

> To restart an application using the Bluemix CLI

```shell
$ bx app restage APP_NAME
```
> To redeploy an application using the Cloud Foundry CLI

```shell
# Add updated Compose SSL certificate to filesystem
$ cf push APP_NAME
```
> To redeploy an application using the Bluemix CLI

```shell
# Add updated Compose SSL certificate to filesystem
$ bx app push APP_NAME
```

The Client Application Owners should restart or redeploy the application based on the application needs.  The time objective is less than 10 minutes per application.

  * **Filesystem**: Applications that read the Compose SSL certificate from the filesystem will need to be redeployed with the updated Compose SSL certificate available from the Compose Dashboard.
  * **Services**: Applications that read from environment variables, such as `VCAP_SERVICES` or user-defined environment variables may only require the application to be restaged, in order for the application to re-read the new service credentials.

<aside class='warning'>
Pushing or restaging an application will require the build process to commence. Changes in buildpacks may cause unexpected issues.
</aside>

#### 15. Application Recovery Confirmation

The Client Application Owners and Client IT Administrators verifies impacted applications are now able to respond to production requests. The time objective is less than 10 minutes per application.

### Resolution

Migrating from the disaster recovery (DR) site would entail creating (or restoring) the original cluster to a known-good state, followed by a full backup of the DR site being taken and then applied on the original cluster.

The Compose and Bluemix Support teams are primarily responsible for coordinating the restoration and migration of the original datacenter site. The Compose and Bluemix support team will coordinate directly with the Client IT administrators.

### Escalation Path

Client IT Administrators should contact their IBM account managers if an escalation is required.

### Applicable Situations

This runbook was designed to address a complete loss of the Compose service from the Bluemix platform. Applicable situations include, but are not limited to:

* Natural Disaster
* Datacenter power loss
* Irreparable loss of network connectivity
