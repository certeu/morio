# Morio defaults

This folder holds defaults for various components of Morio.  
We refer to it as **defaults** for short.

It holds files with configuration defaults for various Morio components. By
centralizing different configuration defaults, we want to make it easier for
people to find their way in this monorepo.

## Getting Started

First of all, since this is a monorepo you should follow the Getting Started
instructions in the README.md file in the root of this repository.

Once that is done, cd into this folder and run the following command to build/bundlethe defaults:

```
cd api
npm run build
```

Note that you do not need to build the defaults, they will be imported from
source in development, not from a built artifact.

