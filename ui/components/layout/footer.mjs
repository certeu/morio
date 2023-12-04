// Components
import Link from 'next/link'

export const Footer = () => (
  <footer className="bg-neutral">
    <div className="w-full sm:w-auto flex flex-col gap-2 items-center justify-center pt-12">
      morio
      <div className="mt-4">
        morIO
      </div>
      <p className="text-neutral-content text-normal leading-5 text-center -mt-2 opacity-70 font-normal">
        morio slogan
      </p>
    </div>

    <div className="w-full max-w-xl text-center py-8 m-auto">
      <ul className="text-neutral-content list inline font-medium text-center">
          <li className="block lg:inline">
            <Link href="/" className="p-3 underline decoration-2 hover:decoration-4">
              morio link
            </Link>
          </li>
      </ul>
    </div>

    <div className="w-full sm:w-auto flex flex-row flex-wrap gap-6 lg:gap-8 items-center justify-center px-8 py-14">
      more io
    </div>

  </footer>
)
