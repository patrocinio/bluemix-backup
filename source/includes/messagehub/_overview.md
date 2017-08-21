# Message Hub

Message Hub is a scalable, distributed, high throughput message bus on the IBM Cloud, available as a fully managed Bluemix service. It is based on Apache Kafka - a fast, scalable, and durable real-time messaging engine from the Apache Software Foundation. To understand the benefits of using Apache Kafka as a service, see [Message Hub: Apache Kafka as a Service](https://developer.ibm.com/messaging/2016/03/14/message-hub-apache-kafka-as-a-service/).

Kafka, and subsequently Message Hub, was designed as a fault-tolerant, distributed system, so Message Hub should remain highly available even during failure conditions. At this time, Message Hub, does not provide the ability to backup or restore message queues or queue metadata. If a catastrophic failure were to occur, applications and application owners will have to re-establish the necessary queues and possibly employ "retry logic" to ensure a message is sent. 
