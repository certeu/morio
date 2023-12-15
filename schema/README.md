# Morio schema

This folder holds the schema for various types of data and configuration in Morio.  
We refer to it as **schema** for short.

It holds files the describe the configuration and data processed by various
Morio components. By centralizing this schema definition, we want to make it
easier for people to find their way in this monorepo.

## Getting Started

First of all, since this is a monorepo you should follow the Getting Started
instructions in the README.md file in the root of this repository.

Once that is done, these files will be available as imports to other packages
through the user of npm workspaces, and the exports defined in package.json.

Note that you do not need to build these files, they will be imported from
source in development, not from a built artifact.

