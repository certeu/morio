---
title: Connector
tags:
  - connector
---

The `connector` service is responsible for routing data from/to Morio.  It is
also capable of transforming data, as well as routing between local Morio
topics.

This services utilizes [Logstash](https://www.elastic.co/logstash), a 
Swiss army knife for data routing and transformation.

<Note>
- This service is __not available__ in [ephemeral state](/docs/reference/terminology/ephemeral-state/).
- This service can be deployed on a [flanking node](/docs/reference/nodes/#flanking-nodes).  
</Note>


