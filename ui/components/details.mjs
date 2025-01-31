import { RightIcon } from './icons.mjs'

export const Details = ({
  summaryLeft,
  summaryRight = null,
  children,
  summaryClassname = 'justify-between',
  open=false
}) => (
  <details className="bg-primary/20 rounded mt-4 open:bg-transparent open:border-l-4 open:shadow hover:bg-primary/30 open:hover:bg-transparent open:cusor-default border-primary group" open={open ? true : false}>
    <summary
      className={`flex flex-row gap-2 items-center hover:cursor-pointer pr-4 group-open:bg-primary/20 ${summaryClassname}`}
    >
      <div className="flex flex-row gap-2 items-center p-2 group-open:p-2 hover:group-open:bg-primary/30 font-bold">
        <RightIcon className="w-4 h-4 transition-transform group-open:rotate-90" stroke={3} />
        {summaryLeft}
      </div>
      {summaryRight}
    </summary>
    {children}
  </details>
)
