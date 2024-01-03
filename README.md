# morio

This is an incubator/lab to test-drive some new ideas for log collection.

## What's with the name?

Right from the start, we need a name. To create a repository for example, we
need to give it a name.  
I was mulling it over one weekend, and landed on **morio**. Here's why:

**It's a _data plumbing_ project**

Making sure data flows from every little place where it's generated to our data lake is the data equivalent of plumbing.
It's not very sexy, but it is very important. See how you fair when the drain in your kitched gets clogged, or worse, your toilet.

Plumbing is not sexy or cool, so we borrow some cool from the world's most beloved plumber: **Mario**.  
This is Morio, not Mario. But it's a good reminder that plumbers rock.

**More data in, more value out**

Another way to explain the **morio** name is to read it as **More IO**.  
If we can make it easy (and affordable) to stream more data, we can get more value out of that stream.

## Components

This is pre-alpha for now, but the following components have been created:

### UI

The idea is that we will end up with an appliance-like box that people can administer via a web interface.

The `ui` folder holds that web interface. It will be a static-HTML website that does everything through the API.

### API

Morio is an API-first project. Everything should go via the API. The `api` folder holds that API.

So the web interface we are building to manage morio connects to the API.
But if people don't want to use the web interface and talk to the API directly, that's fine too.

### SAM

SAM (System Actions Manager) is responsible for taking actions on the system level (the host OS).
Typically, this mean talking to the Docker Daemon, getting the list of running containers,
restarting containers and so on.

Access to SAM is not exposed to users. Instead, it will be called internally by the API
over the internal Docker network.

### Traefik

Traefik is an edge router and is used as reverse proxy inside Morio.
It watches the Docker socket and will configure itself based on labels set on Docker containers.

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
git clone git@github.com:joostdecock/dotfiles.git
```

Or via HTTPS:

```
git clone https://github.com/joostdecock/dotfiles.git
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

### Install docker-compose

You need to make sure you have version 2 of docker-compose on your system.
Debian 12 ships with version 1, so grab the latest binary from https://github.com/docker/compose/releases/latest

Make sure to make it executable, and move it into your PATH. Something like this:

```sh
curl -L  https://github.com/docker/compose/releases/download/v2.23.3/docker-compose-linux-x86_64 -o docker-compose
chmod +x docker-compose
sudo mv docker-compose /usr/local/bin/
```

Now if you run:

```sh
docker-compose -v
```

It should look something like this:

```
Docker Compose version v2.23.
```

### Build the containers

The development environment will start (the development version of) a couple of containers.
Before we can do that, we need to build them:

```
npm run build
```

### Permissions

```
sudo addgroup --gid 2112 morio
sudo adduser --gid 2112 --uid 2112 --disabled-login morio
sudo chgrp -R morio .
chmod -R 775 ui/.next/
```

### Start the development environment

In the repository root run:

```
npm run dev
```
