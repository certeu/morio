---
title: Documentation Guide
---

The Morio documentation is hosted in the [certeu/morio][repo] respository on GitHub. In other words, the documentation for Morio is in the same repository as all other Morio code as we use a so-called _monorepo_.

We store our documentation as [Markdown](https://www.markdownguide.org/) and use
[Docusaurus][docusaurus] to generate a static website from it, which we then publish.

Apart from the [custom components](#custom-components), and [redoc integration](#redoc-integration) we use a fairly
standard Docusaurus setup, so check [the Docusaurus
documentation](https://docusaurus.io/) for more details.

<Tip>
If you spot a mistake or see something that you can improve, please do not hesitate to do so.
</Tip>

## Making quick edits


The fastest way is via the **Edit this page** link that you can find at the bottom of every page. This will take you to the GitHub online editor where you can propose changes directly.

Alternatively, you can find the file in [our monorepo][repo] and make changes that way.
Whereas the `docs` folder in our monorepo holds the Docusaurus files, the actual documentation -- the markdown content -- is located in the `docs/docs` folder. 

Contributors looking to improve our documentation should update the various
markdown files under [the `docs` folder][docs].

## Running the documentation site locally

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

<Warning>
### Untested on Windows

While we support Microsoft Windows as a platform for the Morio client, no Microsoft Windows is used in the development of Morio.
If you are on Windows, your mileage may vary.
</Warning>


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

### Scode

<Scode>
The Morio source code is available at [github.com/certeu/morio](https://github.com/certeu/morio).
</Scode>

```markup title="readme.md"
<Scode>
The Morio source code is available at [github.com/certeu/morio](https://github.com/certeu/morio).
</Scode>
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
Use this when a certain action is potentially destructive or problems are likely to occur.
</Warning>

```markup title="readme.md"
<Warning>
Use this when a certain action is potentially descructive.
</Warning>
```

### WithCaption

<WithCaption caption="This allows you to put a caption under anything">
![Placeholder image](https://dummyimage.com/1200x400/3/a&text=It's-a%20me,%20Morio!)
</WithCaption>

```markup title="readme.md"
<WithCaption caption="This allows you to put a caption under anything">
![Placeholder image](https://dummyimage.com/1200x400/3/a&text=It's-a%20me,%20Morio!)
</WithCaption>
```

[netlify]: https://www.netlify.com/
[docusaurus]: https://docusaurus.io/
[docs]: https://github.com/certeu/morio/tree/develop/docs/docs
[repo]: https://github.com/certeu/morio
