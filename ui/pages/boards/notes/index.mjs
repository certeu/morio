import { useState } from 'react'
import { PageWrapper } from 'components/layout/page-wrapper.mjs'
import { ContentWrapper } from 'components/layout/content-wrapper.mjs'
import { TipIcon } from 'components/icons.mjs'
import { Popout } from 'components/popout.mjs'
import { useQuery } from '@tanstack/react-query'
import { useApi } from 'hooks/use-api.mjs'
import { Notes } from 'components/boards/notes.mjs'
import { cacheStreamAsObj, ToggleLiveButton } from 'components/boards/shared.mjs'

const meta = {
  title: 'Notes',
  page: ['boards', 'notes'],
  Icon: TipIcon,
}

export default function NotesDashboardPage () {
  return (
    <PageWrapper {...meta}>
      <ContentWrapper {...meta}>
        <Notes />
      </ContentWrapper>
    </PageWrapper>
  )
}

/*
        <div className="max-w-4xl">
          <div className="flex flex-row gap-2 items-center">
            <ToggleLiveButton {...{ paused, setPaused }} />
            {tip ? (
              <Popout tip>
                <h4>What are notes? And why are notes?</h4>
                <p>
                  Notes are closely related to the Tap service.
                  This service handles stream processing and typically handles all log entries flowing through Morio.
                </p>
                <p>
                  This creates a potential feedback loop when logging inside a Tap handler will cause these log lines
                  to be ingested and also processed by the same Tap handler, which will log more data, and things
                  will snowball from there.
                </p>
                <p>
                  So as a general rule, Tap handlers never log, but instead add <code>notes</code> to the cache directly.
                  <br />
                  As such, these notes typically provide information about
                  unexptected data or formatting issues detected by a Tap handler.
                </p>
                <p className="text-right">
                  <button className="btn btn-primary btn-outline" onClick={() => setTip(false)}>Dismiss Tip</button>
                </p>
              </Popout>
            ) : (
              <button className="btn btn-xs btn-primary btn-outline border-2" onClick={() => setTip(!tip)}>What are notes?</button>
            )}
            </div>
          {Object.entries(cacheStreamAsObj(data.value)).map(([id, note]) => <Note key={id} id={id} note={note} />)}

        </div>
        */
