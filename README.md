> [!Warning]
>
> ##### Morio is currently early-access alpha code.
>
> We are building this in the open, so feel free to look around,
> try it out, or [leave feedback](https://github.com/certeu/morio/discussions).
>
> That being said, you probably don't want to run this in production yet.

<p align='center'><a 
  href="https://deepscan.io/dashboard#view=project&tid=24001&pid=27249&bid=869644"
  ><img src="https://deepscan.io/api/teams/24001/projects/27249/branches/869644/badge/grade.svg" 
  alt="DeepScan grade"
  ></a></p>

# Morio

![image](https://github.com/certeu/morio/assets/1708494/91892e94-0cb5-4c94-8845-ffe52c19c417)

## What is Morio?

Morio is an end-to-end streaming data backbone for your observability needs.

Deploy the Morio client (based on Elastic Beats) on your endpoints, and collect
their data on one or more centralized Morio instances for analysis, further
processing, downstream routing & filtering, or event-driven automation.

Under the hood, Morio utilizes best-of-breed open source technologies, such as
[RedPanda](https://redpanda.com/) for its Kafka-compatible streaming API,
[Smallstep Step-CA](https://smallstep.com/docs/step-ca/) for X.509 certificate
provisioning and mTLS authentication, [Beats](https://www.elastic.co/beats) and
[Logstash](https://www.elastic.co/logstash) from [Elastic](https://www.elastic.co/) for
collecting/shipping and routing data respectively, and
[Traefik](https://traefik.io/traefik/) as entrypoint proxy for all HTTP-based
services.

While anyone with sufficient expertise, time, and dedication can build a
state-of-the-art streaming data infrastructure out of these components, with Morio
you don't have to.
Morio provides an appliance-like experience where you can setup and configure
the entire system through it's web UI or REST API.

## Current status

Morio is **alpha code and under active development**.
It is not ready to handle your production workloads, and likely won't be for a while.

## What's with the name?

Right from the start, we needed a name. To create a repository for example, we
need to give it a name.
I was mulling it over one weekend, and landed on **morio**. Here's why:

**It's a _data plumbing_ project**

Making sure data flows from every little place where it's generated to your
data lake is the data equivalent of plumbing. It's not very sexy, but it is
very important. See how you fair when the drain in your kitched gets clogged,
or worse, your toilet.

Plumbing is not sexy or cool, so we borrow some cool from the world's most
beloved plumber: **Mario**. This is Morio, not Mario. But it's a good reminder
that plumbers rock.

**More data in, more value out**

Another way to explain the **morio** name is to read it as **More IO**. If we
can make it easy (and affordable) to stream more data, we can get more value
out of that stream.

## Components

Morio is a collection of various components that are pre-configured to work
together.

### API

Morio is an API-first project. Everything you can configure in Morio can be
configured through its management API.

The `api` folder holds that API.

### Broker (RedPanda)

The main ingestion of data in Morio is handled by RedPanda, which exposes a
Kafka-compatible API.

### Certificate Authority (SmallStep CA)

We require encryption, and thus need X.509 certificates. Morio provides its own
Certificate Authority (CA) based on SmallStep.

### Clients

Morio provides a single client package for linux and windows. It's an umbrella
package that bundles preconfigured instances of filebeat, metricbeat, as well
as audibeat (linux only) and winlogbeat (windows only).

### Core

Morio core (for COnfig REsolution) is responsible for turning your high-level
Morio settings into the detailed configuration required for the various
components.

It is also responsible for taking actions on the system level (the host OS),
including starting and stopping the other components, by talking to the Docker
daemon.

Note that core is not exposed to users. Instead, it will be called internally
by the API over the internal Docker network.

### Proxy (Traefik)

Traefik is an edge router and is used as reverse proxy inside Morio.

### UI

The Morio UI provides a web interface to interact with and configure Morio.
The `ui` folder holds that web interface.

## Getting started

First clone this repository:

```
git clone git@github.com:certeu/morio.git
```

Then, enter the newly created `morio` folder and run the kickstart script:

```
cd morio
npm run kickstart
```

This will setup dependencies, and get your repository in a state that is ready to go.

To start the development environment, you first need to build the various container images:

```
npm run build
```

Then you can run:

```
npm run dev
```

## Development environment setup

Here are some notes on what it takes to setup Morio. This is for a Debian based system.

### Install depedencies

To develop Morio, we'll need docker and git.
We'll also add vim as our editor, and curl which we'll use to test things:

```sh
sudo apt-get install git docker.io vim curl
```

We will also need NodeJS. I recommend using nvm to install it: https://github.com/nvm-sh/nvm

We will be using NodeJS 20, specifically the LTS release known as iron. So install it:

```
nvm install lts/iron
```

### Clone repository

Via SSH:

```
git clone git@github.com:certeu/morio.git
```

Or via HTTPS:

```
git clone https://github.com/centeu/morio.git
```

### Run kickstart

Enter the root of the repository and run:

```
npm run kickstart
```

This will install all (node) dependencies, and setup some repository specific things.

### Rights to the docker socket

To run the development environment, we'll be starting containers. This requires access to the docker socket.
Typically, you can grant yourself access by adding your user to the `docker` group:

```
sudo usermod -aG docker $USER
```

You will need to log out and back in for this change to take effect.
Alternatively, `newgrp docker` will work too.

### Build the containers

The development environment will start (the development version of) a couple of containers.
Before we can do that, we need to build them:

```
npm run build
```

### Permissions

FIXME: Detail permissions and UIDs here.

### Start the development environment

In the repository root run:

```
npm run dev
```

You probably want to keep an eye on the docker logs of core to see what's going on:

```
docker logs -f core
```

Or, to format the logs nicely, install pino-pretty:

```
npm i -G pino-pretty
```

Then pipe the logs into it, stripping some of the fields we don't care about:

```
docker logs -f core | pino-pretty --ignore pid,time,hostname
```
