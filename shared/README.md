# Morio lib

This folder holds shared functionality for various NodeJS based packages.  
We refer to it as **lib** for short.

These files are typically abstracted here to keep the code DRY.

Note that they use various NodeJS APIs that are not available in the browser.
Typically things like local filesystem access, and so on.
So you should not use this in any browser-based on (like ui).

## Getting Started

First of all, since this is a monorepo you should follow the Getting Started
instructions in the README.md file in the root of this repository.

Once that is done, these files will be available as imports to other packages
through the user of npm workspaces, and the exports defined in package.json.

Note that you do not need to build these files, they will be imported from
source in development, not from a built artifact.
