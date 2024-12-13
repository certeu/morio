import { TipIcon } from 'components/icons.mjs'

export const Note = ({ id, note }) => {
  const { title, data } = note

  return (
    <details className="group">
      <summary className="flex flex-row gap-2 rounded my-1 hover:cursor-pointer hover:bg-secondary hover:bg-opacity-20 px-2 group-open:bg-secondary group-open:bg-opacity-30">
        <h6 className="flex flex-row items-center flex-wrap gap-2 justify-between w-full">
          <TipIcon className="w-6 h-6 text-warning group-open:text-secondary"/>
          <span className="grow">{title}</span>
          <span className="badge badge-neutral badge-sm text-sm group-open:badge-secondary">{data.host?.id ? data.host.id : 'unknown-host-id'}</span>
        </h6>
      </summary>
      <div className="ml-8 border border-4 border-y-0 border-r-0 border-secondary pl-4 mb-4">
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    </details>
  )
}
