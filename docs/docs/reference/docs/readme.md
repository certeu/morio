---
title: Documentation
---

<Tldr>
Morio's documentation is kept as markdown in [the `docs` folder][docs] of [our
monorepo][repo], and published on [Netlify][netlify] using
[Docusaurus][docusaurus].  
</Tldr>

The Morio documentation is maintained in [our monorepo][repo] under [the `docs`
folder][docs].

We keep our documentation in Markdown and use
[Docusaurus][docusaurus] to generate a static site that we host on [Netlify][netlify].

Contributors looking to improve our documentation should update the various
markdown files under [the `docs` folder][docs].

Apart from the [custom components](#custom-components), we use a fairly
standard Docusaurus setup, so check [the Docusaurus
documentation](https://docusaurus.io/) for more details.

## Running a local instance

To run a local instance of the documentation site -- higly recommended if
you're looking to make non-trivial changes to the documentation -- you can
follow these steps:

```sh title="Terminal"
git clone git@github.com:certeu/morio.git
cd morio
npm install
cd docs
npm run start
```

In other words:
- Clone the repository
- Install dependencies
- Run `npm run start` in the `docs` folder

The docs site will now be running on http://localhost:3000 and any changes you
make will be hot-reloaded.

## Custom components

We provide some MDX components that you can use in documentation pages. 
They are typically various ways to engage the reader with the material.

The full list is included below:

### Comment

<Comment by='joost'>
Comments are most useful when something is opinion, rather than fact.
</Comment>

```markup title="readme.md"
<Comment by='joost'>
Comments are most useful when something is opinion, rather than fact.
</Comment>
```

### Fixme

<Fixme>
Use this to indicate something needs work or is incomplete.
</Fixme>

```markup title="readme.md"
<Fixme>
Use this to indicate something needs work or is incomplete.
</Fixme>
```

### Important

<Important>
You need to start a new line after the opening tag of a custom component to ensure your markdown within the component will be parsed.
</Important>

```markup title="readme.md"
<Important>
You need to start a new line after the opening tag of a custom component to ensure your markdown within the component will be parsed.
</Important>
```

### Note

<Note>
This is a good way to draw the reader's attention to additional information.
</Note>

```markup title="readme.md"
<Note>
This is a good way to draw the reader's attention to additional information.
</Note>
```

### Related

<Related>
If you are new to MDX, you can check the documentation at [mdxjs.com](https://mdxjs.com/).
</Related>

```markup title="readme.md"
<Related>
If you are new to MDX, you can check the documentation at [mdxjs.com](https://mdxjs.com/).
</Related>
```

### Tip

<Tip>
If there is a lot of information on the page, start with a `Tldr` component that holds a summary.
</Tip>

```markup title="readme.md"
<Tip>
If there is a lot of information on the page, start with a `Tldr` component that holds a summary.
</Tip>
```

### Tldr

<Tldr>
Too long; Didn't read
</Tldr>

```markup title="readme.md"
<Tldr>
Too long; Didn't read
</Tldr>
```

### Warning

<Warning>
Use this when a certain action is potentially descructive.
</Warning>

```markup title="readme.md"
<Warning>
Use this when a certain action is potentially descructive.
</Warning>
```

[netlify]: https://www.netlify.com/
[docusaurus]: https://docusaurus.io/
[docs]: https://github.com/certeu/morio/tree/develop/docs/docs
[repo]: https://github.com/certeu/morio
