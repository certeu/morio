---
title: Connector
---

The `connector` service is responsible for routing data from/to Morio.  It is
also capable of transforming data, as well as routing between local Morio
topics.

This services utilizes [Logstash](https://www.elastic.co/logstash), a 
Swiss army knife for data routing and transformation.

<Note>
##### Flanking service
The `connector` service can be deployed on either a
[data node](/docs/reference/nodes/#data-nodes) or a [flanking
node](/docs/reference/nodes/#flanking-nodes).  
</Note>


