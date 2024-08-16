---
title: Contributor Guide
sidebar_position: 0
---

import Help from '@site/includes/cli-help-content.md'

If you are you looking to contribute to Morio, or want to learn more
about it, this guide is a good starting point.

This is a high-level overview, with links to more detailed info.
We'll cover the following topics:

- [Governance](#governance)
- [License](#license)
- [Code-of-Conduct](#code-of-conduct)
- [Source Code](#source-code)
- [Documentation](#documentation)
- [Help & Feedback](#help--feedback)

## Governance

Morio is a project by [CERT-EU](https://www.cert.europa.eu/), the
_Cybersecurity Service for the Institutions, Bodies, Offices and Agencies of
the [European Union](https://europa.eu/)_. It is CERT-EU's management under
supervision of the EU's _Interinstitutional Cybersecurity Board_ (_IICB_), who
have the final say on all things CERT-EU, including Morio.

The day to day management of the project is in the hands of CERT-EU's engineering team.

<Related>
To learn more about CERT-EU or the IICB, consult this summary on EUR-Lex:  

- [Cybersecurity at the European Union institutions, bodies, offices and
  agencies](https://eur-lex.europa.eu/EN/legal-content/summary/cybersecurity-at-the-european-union-institutions-bodies-offices-and-agencies.html)
  _(1-minute read)_.
</Related>

## License

Morio uses [the EUPL
license](https://en.wikipedia.org/wiki/European_Union_Public_Licence), an
OSI-approved free software license that exists to _encourage a new wave of
public administrations to embrace the Free/Open Source model to valorise their
software and knowledge_
[[source](https://commission.europa.eu/content/european-union-public-licence_en)]

When you contribute to Morio, those contributions shall also be licensed as EUPL.

## Code of Conduct

Our [code of
conduct](https://github.com/certeu/morio/blob/develop/CHANGELOG.md) is a
verbatim copy of the [Contributor Covenant v2.1](Contributor Covenant v2.1).
The only change made are the insertion of CERT-EU's contact details.

As a Morio contributor, you must respect and uphold this code of conduct.

## Source Code

The Morio source code is hosted on GitHub at [certeu/morio][repo].
This is a _monorepo_ that holds all the code for the Morio project.

Contributions should be made as pull requests against the `develop` branch.

<Related>
To learn more, refer to [the monorepo guide](/docs/guides/contributors/monorepo).
</Related>


## Documentation

The Morio documentation is (also) hosted in the [certeu/morio][repo] repository on
GitHub, specifically in the `docs/docs` folder.

<Related>
To learn more, refer to [the documentation guide](/docs/guides/contributors/docs).
</Related>


## Help & Feedback

Run `npm run help` in the _monorepo_ root for pointers on how to get help.
The output will resemble this:

<Help />
