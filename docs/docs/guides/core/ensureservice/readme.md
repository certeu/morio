---
title: The ensureService() method
sidebar_position: 50
---

Core's `ensureService()` method ensures a service is in its desired state.

It is called from [the `startMorio()` method](/docs/guides/core/startmorio) for
services that are always running, or on-demand when a service is required, such
as the various builder services that build client packages.

The `ensureService()` method goes through the following steps:

- First, it calls [the `wanted` lifecycle hook](/docs/reference/core/hooks/wanted) of the service
- If the services __is not wanted__:
  - It will stop the service if it is running
  - It will __return early__
- If the service __is wanted__, it will resolve the service and container configuration
- Next, it will verify whether the service __needs to be recreated__
- If the service container __needs to be recreated__:
  - It calls [the `preCreate` lifecycle hook](/docs/reference/core/hooks/precreate) of the service
  - It will recreate the service container
- Then, it will verify whether the service __needs to be restarted__
- If the service __needs to be restarted__:
  - It calls [the `preStart` lifecycle hook](/docs/reference/core/hooks/prestart) of the service
  - It (re)starts the service container
  - It calls [the `postStart` lifecycle hook](/docs/reference/core/hooks/poststart) of the service
- Finally, it calls [the `reload` lifecycle hook](/docs/reference/core/hooks/reload) of the service

##### Flowchart of the `ensureService()` method inside Morio Core

```mermaid
flowchart TD
    R("Return (done)")
    1("Call wanted lifecycle hook")
    --> 2{{"Is service wanted?"}}
    3{{"Is service running?"}}
    2 -->|No|3 
    4(Stop Service Container)
    4 -->R
    3 -->|Yes|4
    3 -->|No|R
    5("Resolve Service & Container configuration")
    2 -->|Yes|5 
    5 -->6{{"Should service container be recreated?"}}
    7("Call preCreate lifecycle hook")
    --> 8("Recreate the service container")
    6 -->|Yes|7
    9{{"Should service container be restarted?"}}
    10("Call preStart lifecycle hook")
    11("(Re)Start the container")
    12("Call postStart lifecycle hook")
    12("Call reload lifecycle hook")
    6 -->|No|9
    8 --> 9
    9 -->|No|12
    9 -->|Yes|10
    10 --> 11
    11 --> 12
    12 --> R
```
