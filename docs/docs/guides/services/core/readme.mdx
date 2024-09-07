---
title: Core Service Guide
tags:
  - core
---

The **Morio Core Service** (core) sits at the root of any Morio deployment and is
responsible for [orchestration](#orchestration), [configuration
resolution](#configuration-resolution), and [clustering](#clustering).

Core is a Morio internal service, meaning that as a Morio user -- or even
administrator -- you do not interact with it. As such, this guide covers
the high-level responsibilities of the service, allowing you to get a grasp
of what it is and what it does.

## Core service responsibilities

The core service runs on every Morio node, and handles the following
responsibilities:

### Orchestration

The core service is responsible for creating and starting all other Morio services.
If a service is not running that should be running, the core service will create a container for it, and start it.
Or, if a service is running that should not be running, the core service will stop it.

Other tasks that fall under _orchestration_ are things like creating the Docker
network and attaching itself and other containers to it, as well as pulling
down images that are not available on the local Docker host.

To be able to accomplish this task, the core service needs access to the Docker
socket on the host OS, which is provided by mounting the socket in the
container.

Given that access to the host OS' Docker socket is a high-privilege access, the
core service is internal, and not a user-facing service. Only [its `/status`
endpoint](/oas-core#tag/status/paths/~1status/get) is accessible to users.

### Configuration Resolution

The core service is also responsible for transforming the high-level Morio
settings into a detailed configuration for the various Morio services.

For example, you do not need to worry about making certain the API is
accessible through the proxy service, core will handle all of that and more for
you.

To be able to accomplish this task, core need access to shared storage with the
various services. For example, core will generate a configuration for the proxy
service to disk, and the proxy service will then _find_ its configuration ready
to go when it starts up.

For this to be possible, core relies on access to mounted folders on the Host
OS that are also mounted on the various services.

### Clustering

Last but not least, core is also responsible for enabling clustering support in
Morio, as well as keeping a cluster of Morio nodes running and healthy.

That includes initial cluster formation, where all you need is to install Morio
on all the cluster nodes, and then setup 1 of the nodes with the clustered
settings. Core will also run the cluster heartbeat, making sure that
everything is ok, and ensure that the cluster has 1 leader node and the rest of
the nodes will be follower nodes.

Clustering is not a goal as such, it provides high-availability, meaning that
if a node goes down, Morio as a whole keeps on ticking.
