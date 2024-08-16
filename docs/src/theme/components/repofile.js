import React from 'react';
import Link from '@docusaurus/Link';

export const RepoFile = ({ children }) => <Link
  title="Show this file in the certeu/morio repository on GitHub"
  href={`https://github.com/certeu/morio/blob/develop/${children}`}
><code>{children}</code></Link>

