---
title: 'Morio v0.3.0'
authors: [jdecock]
tags: [morio, release, alpha, v0.3.0]
---

We have released verion 0.3.0 of Morio, which brings initial clustering support.

<!-- truncate -->

We [wrote about the new support for clustered
deployments](/blog/2024/08/01/clustering-support) last week, and it's the main
feature in this release. Check [the
changelog](https://github.com/certeu/morio/blob/develop/CHANGELOG.md) for all
details.

With this release, we've also started working on our build pipelines,
and from this release onwards, we will publish container images on the
Docker registry for our releases.  
The first batch of images published in this release are:

- [itsmorio/api](https://hub.docker.com/repository/docker/itsmorio/api/general)
- [itsmorio/core](https://hub.docker.com/repository/docker/itsmorio/core/general)
- [itsmorio/dbuilder](https://hub.docker.com/repository/docker/itsmorio/dbuilder/general)
- [itsmorio/ui](https://hub.docker.com/repository/docker/itsmorio/ui/general)

Note that we are using the `itsmorio` namespace, as `morio` was taken ¯\\\_(ツ)\_/¯

All published images are tagged with their version with a `v` prefix, as well
as the (default) `latest` tag.
So for this release, the images are tagged as both `v0.3.0` and `latest`.

On the next release, the `latest` tag will move to the newest release, while
older releases remain available by their version tag.
