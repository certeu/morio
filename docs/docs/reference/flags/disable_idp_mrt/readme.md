---
title: DISABLE_IDP_MRT
tags: 
  - flag
  - mrt
  - idp
---

Enable this flag to disable [the `mrt` identity
provider](/docs/guides/idps#mrt) thereby blocking authentication via the _Morio
Root Token_.

Note that if you enable this flag in your initial settings, you will have
effectively locked yourself out of your Morio deployment unless you have also
included an alternative identity provider.

As such, we recommend to not enable this flag until after you have made sure
you have an alternative identity provider that you know is functioning as
expected.

<Comment by="joost">
This flag is not implemented yet, but it's on our todo list. 
</Comment>

<Fixme>
### You currently cannot rotate the root token

You cannot -- at this time -- rotate the Morio Root Token.
We plan to add support for rotating the root token in the future, but for the time being it is not supported.

So this flag can be used as a short-term solution in case your root token is compromised.
</Fixme>


