---
title: preCreate
---

The `preCreate` lifecycle hook is called before a container/service is created.

For example, the [console service](/docs/reference/services/console/) will use
the `preCreate` lifecycle hook to check for a configuration in the `preCreate`
lifecycle hook, and write it to disk if it is not already present.  This is
done in the `preCreate` hook because the console configuration never changes,
so there is no need to run this in the `preStart` hook.

