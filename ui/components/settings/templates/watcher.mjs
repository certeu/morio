import { Popout } from 'components/popout.mjs'

/*
 * Watcher service (heartbeat)
 */
export const watcher = () => {
  const template = {
    title: 'Watcher (Heartbeat)',
    about: 'Configure monitors to run hearlthchecks, which will be published to the `checks` topic.',
    type: 'info',
    children: {
      monitors: {
        type: 'form',
        title: 'Monitors',
        form: [
          {
            linearTabs: true,
            tabs: {
              HTTP: [
                `### HTTP Monitors`,
                <Popout fixme key='pop'>To be completed</Popout>,
              ],
              TCP: [
                `### HTTP Monitors`,
                <Popout fixme key='pop'>To be completed</Popout>,
              ],
              ICMP: [
                `### HTTP Monitors`,
                <Popout fixme key='pop'>To be completed</Popout>,
              ],
            },
          },
        ],
      },
    },
  }

  return template
}
