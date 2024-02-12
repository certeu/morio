import { Link } from 'components/link.mjs'

export const Card = ({ desc, Icon = null, width = 'w-72', ...aProps }) => (
  <Link
    className={`${width} border px-4 pb-4 rounded shadow hover:bg-secondary hover:bg-opacity-20 flex flex-col`}
    {...aProps}
  >
    <h3 className="capitalize text-base-content flex flex-row gap-2 items-center justify-between text-2xl">
      {aProps.title}
      <Icon className="w-8 h-8 shrink-0 grow-0" />
    </h3>
    <p className="grow">{desc}</p>
  </Link>
)
