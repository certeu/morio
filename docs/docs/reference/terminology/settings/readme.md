---
title: Settings
---

In Morio, __settings__ are the high-level _settings_ that you provide to Morio.

Morio -- specifically [Morio Core](/docs/guides/services/core) -- will take the high-level settings
provided by the user,  and resolve them into a detailed configuration for all
services.  
You can think of <b>core</b> as the <b>co</b>nfiguration <b>re</b>solver.

The diagram below illustrates how settings configuration relate to each
other within Morio:

<Architecture caption="Schematic overview of how core resolved the high-level Morio settings into a detailed configuration for each service">
```
flowchart TD
  subgraph Morio Node
    api("API<br /><small>(Morio)</small>")
    db[("DB<br /><small>(Rqlite)</small>")]
    broker[("Broker\n<small>(RedPanda)</small>")]
    ca("CA\n<small>(SmallStep)</small>")
    connector("Connector<br/><small>(Logstash)</small>")
    console("Console\n<small>(RedPanda)</small>")
    core("Core<br /><small>(Morio)</small>")
    proxy("Proxy<br /><small>(Traefik)</small>")
  end
  user("Morio User")

  user --> |Settings|api
  api --> |Settings|core
  core --> |Configuration|broker
  core --> |Configuration|ca
  core --> |Configuration|console
  core --> |Configuration|db
  core --> |Configuration|proxy
  core --> |Configuration|connector

  class core blue;
  class core2 blue;
  class api blue;
  class ui blue;
  class proxy blue;
  class ca green;
  class connector green;
  class console green;
  class db green;
  class broker green;
```
</Architecture>

