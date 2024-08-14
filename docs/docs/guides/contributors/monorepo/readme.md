---
title: Monorepo Guide
---

The Morio source code is hosted in the [certeu/morio][repo] respository on GitHub.
This is a so-called _monorepo_, meaning that it combines the source code for
different aspects of the Morio project in a single repository.

This guide will help you familiarize yourself with the repository layout, where
you can find what, as well as how to utilize the repository locally.

## Prerequisites

To use our monorepo, you need __git__ and __NodeJS__, as well as __a GitHub account__.

If you have those, you can skip ahead to [getting started](#getting-started).
If not, read on.


### Installing git

[Git](https://git-scm.com/) is the de-facto standard version control system for
software development. It is what we use to keep the Morio source code under
version control.

<Tip>
#### How to git good

If you are new to git, or feel uncomfortable about using it, there is no need
to worry, we've all been there.

To help you get over git's learning curve, we have create a git training course
that explains how it works, and helps you getting things done.
**Chapter 7** deals specifically with **Installing git**.

It comes highly recommended: [Git Training](/docs/training/git).
</Tip>


- If you are on __linux__, git is probably already installed, and if not you should
be able to install it from your distributions package manager. One of
`apt install git`, `yum install git`, or `dnf install git` should do the trick.
- If you are on __Mac__, git comes with the Xcode developer tools, so if you have
Xcode installed, you are good to go. If not, install it.
- If you are on __Windows__, then [download the git installer for
windows](https://git-scm.com/download/win) and follow the steps.

Once installed, type `git` in a terminal window.
If you get a bunch of output, we are good to go.

<Warning>
#### Windows users beware

The instructions on this page should work for both Linux and Mac systems.  
Windows users using the [Linux Subsystem for Windows
(LSW)](https://learn.microsoft.com/en-us/windows/wsl/install) will _probably_
be ok, but we do not test or support this.
</Warning>

### Install NodeJS

Morio uses [NodeJS](https://nodejs.org/) a JavaScript runtime.

You may already have NodeJS on your system. Run `node` in a command line
terminal to test that.

If you do not have NodeJS, we recommend using nvm -- short for Node Version
Manager -- to install it as that will make it easy to install NodeJS, and use
different versions.

To setup nvm, [follow the install instructions in the nvm README](https://github.com/nvm-sh/nvm#installing-and-updating).

Once installed, type `nvm` in a terminal window.
If you get a bunch of output, nvm was installed successfully.

#### Install NodeJS lts/iron

Morio currently uses NodeJS 20 which is known as `lts/iron`.
The LTS releases provide long term support (lts) and are recomended for production use.

To install the `lts/iron` release of NodeJS with nvm, you run this command:

```sh title="Terminal"
nvm install lts/iron
```

When it's all done, running `node -v` in your terminal should confirm that
version 20 of NodeJS is installed and ready to go.

### Create a GitHub account

If you do not have a GitHub account, you can create one
by going to [github.com/signup](https://github.com/signup) and following
the steps.

GitHub accounts are free of charge. You do not have to pay anything.

## Getting started

To get started, we will clone the reposisory on your local system.

You can either clone the repository directly, or first fork it, then clone the forked repository:

Clone the repository directly if:

- You do not want to make any changes
- Or you have write access to the `certeu/morio`repository

Clone a fork of the repository if:

- You want to make changes
- You do not have write access to the `certeu/morio` repository

### Fork the repository

To fork the repository, you need to be logged in to GitHub, then navigate to
[github.com/certeu/morio/fork](https://github.com/certeu/morio/fork).

This will create a copy of the `certeu/morio` repository under your own account.
Given that it is your own copy, you will be allowed to make changes in it.

### Clone the repository

<Note>
If you did fork the `certeu/morio` reposutory, replace `certeu/morio` by
`username/morio`, where `username` is your GitHub username.
</Note>

Open a terminal window, and navigate to a place where you are happy to keep
your git content.

If you are not sure where to put it, let us create a `git` folder in your home
directory and enter it:

```sh title="Terminal"
mkdir ~/git
cd ~/git
```

Now we can run the command to clone and enter the repository:

```sh title="Terminal"
git clone git@github.com:certeu/morio.git
cd morio
```

### Run kickstart

Once the repository is cloned, you should run the `kickstart` run script:

```sh title="Terminal"
npm run kickstart
```

It will install dependencies, and configure your local repository for use.

When it's ready, your local Morio repository is set up.

## Repository layout

The reposistory has a number of top-level files and folders. 
The most relevant of them are:

- Files:
  - `CHANGELOG.md`: Holds a list of changes in Morio over time and versions
  - `CODE_OF_CONDUCT.md`: Holds Morio's Code of Conduct
  - `LICENSE`: Holds the Morio license (EUPL)
  - `package.json`: The NodeJS configuration file
  - `package-lock.json`: The NodeJS dependency lock file
  - `README.md`: Holds general info about the repository, this is what's shown on [github.com/certeu/morio][repo]
  - `SECURITY.md`: Holds instructions on how to report security issues
- Hidden Files:
  - `.editorconfig`: Holds Morio's [EditorConfig](https://editorconfig.org/) configuration
  - `.eslintignore`: Holds a list of files/patterns [ESLint](https://eslint.org/) should ignore
  - `.gitignore`: Holds a list of files/patterns [git](https://git-scm.com/) should ignore
  - `.prettierignore`: Holds a list of files/patterns [Prettier](https://prettier.io/) should ignore
  - `.prettierrc.json`: Holds the [Prettier](https://prettier.io/) configuration
- Folders:
  - `builders`: Holds source code for the various Morio builder services
  - `clients`: Holds source code for the various Morio clients
  - `config`: Holds configuration
  - `core`: Holds source code for the core service
  - `docs`: Holds (this) documentation
  - `media`: Holds images and other media
  - `moriod`: Holds source code for the moriod package
  - `node_modules`: Holds installed NodeJS dependencies
  - `schema`: Holds configuration for the data schema used in Morio
  - `scripts`: Holds various scripts to automate working with the repository
  - `shared`: Holds shared Morio code
  - `ui`: Holds the source code of the UI service
- Hidden Folders
  - `.git`: Holds git's internal data
  - `.github` Holds GitHub-specific configuration, such as the CI pipelines to run
  - `.husky`: Holds the git pre-commit hook configuration

## Branches and merge requests

Morio's default branch is `develop` whereas the `main` branch is considered the _production_ branch.

Both branches are protected. To propose changes, you must open a pull request to
the `develop` branch (the default branch).  The pull request can be made from
your own fork, or from a feature branch in the `certeu/morio`, assuming you
have the rights to create branches there.

Pull requests will start a number of CI pipelines. Please make sure that all pipelines pass before requesting review.

Before a merge request can be merged, it must get a positive review from someone on the Morio team.
You can request reviews from github users [joostdecock](https://github.com/joostdecock), 
[serge-tellene](https://github.com/serge-tellene) or [lilianbaz](https://github.com/lilianbaz).

## Run scripts

The repository contains a lot of run scripts. We will cover the main ones here.
Refer to the run script reference documentation for all details.







[repo]: https://github.com/certeu/morio
