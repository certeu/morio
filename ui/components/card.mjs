import { Link } from 'components/link.mjs'

export const Card = ({ title, desc, href, Icon = null, width = 'w-72' }) => (
  <Link
    className={`${width} border px-4 pb-4 rounded shadow hover:bg-secondary hover:bg-opacity-20 flex flex-col`}
    href={href}
    title={title}
  >
    <h3 className="capitalize text-base-content flex flex-row gap-2 items-center justify-between">
      {title}
      <Icon className="w-8 h-8 shrink-0 grow-0" />
    </h3>
    <p className="grow">{desc}</p>
  </Link>
)
