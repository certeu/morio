import React, { useState, useEffect } from 'react'
import Layout from '@theme/Layout'
import Link from '@docusaurus/Link'
import { moriohub as hub } from '@site/prebuild/moriohub.mjs'
import Fuse from 'fuse.js'
import { H1, H2, Breadcrumbs } from '@site/src/components/moriohub/entry.js'
import { Overlays } from '@site/src/pages/hub/index.js'

export default function Moriohub() {
  return (
    <Layout
      title={`Moriohub Settings Overlays`}
      description="Morio provides the plumbing for your observability needs"
    >
      <div className="tailwind">
        <div className="max-w-5xl mx-auto mb-12 px-4">
          <Breadcrumbs type="overlays" />
          <H1>Morio Settings Overlays</H1>
          <Overlays />
        </div>
      </div>
    </Layout>
  )
}
