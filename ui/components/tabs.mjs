import React, { useState } from 'react'
import { LeftIcon, RightIcon } from 'components/icons.mjs'

const navBtn = {
  className: 'flex flex-row gap-2 items-center btn btn-sm btn-neutral btn-outline px-0',
}

const TabnavButtons = ({ activeTab, setActiveTab, tablist, linearTabs = false }) => {
  const navids = {
    prev: activeTab === 0 ? (linearTabs ? false : tablist.length - 1) : activeTab - 1,
    next: activeTab === tablist.length - 1 ? (linearTabs ? false : 0) : activeTab + 1,
  }

  return (
    <div className="flex flex-row items-center w-full justify-between mt-4">
      {navids.prev === false ? (
        <span></span>
      ) : (
        <button {...navBtn} onClick={() => setActiveTab(navids.prev)}>
          <LeftIcon />
          <span className="px-2">{tablist[navids.prev]}</span>
        </button>
      )}
      {navids.next === false ? (
        <span></span>
      ) : (
        <button {...navBtn} onClick={() => setActiveTab(navids.next)}>
          <span className="px-2">{tablist[navids.next]}</span>
          <RightIcon />
        </button>
      )}
    </div>
  )
}

export const Tabs = ({ tabs = '', active = 0, navs = false, linearTabs = false, children }) => {
  // Keep active tab in state
  const [activeTab, setActiveTab] = useState(active)

  /*
   * Parse tab list
   */
  const tablist = Array.isArray(tabs) ? tabs : tabs.split(',').map((tab) => tab.trim())

  if (!tablist) return null

  // Pass down activeTab and tabId for conditional rendering
  const childrenWithTabSetter = children.map((child, tabId) =>
    React.cloneElement(child, { activeTab, tabId })
  )

  return (
    <div className="my-2">
      <div className="tabs tabs-bordered" role="tablist">
        {tablist.map((title, tabId) => (
          <button
            key={tabId}
            className={`text-lg font-bold capitalize tab h-auto tab-bordered grow py-2 ${
              activeTab === tabId ? 'tab-active' : ''
            }`}
            onClick={() => setActiveTab(tabId)}
          >
            {title}
          </button>
        ))}
      </div>
      <div className="p-4">{childrenWithTabSetter}</div>
      {navs ? <TabnavButtons {...{ activeTab, setActiveTab, tablist, linearTabs }} /> : null}
    </div>
  )
}

export const Tab = ({ children, tabId, activeTab }) => (activeTab === tabId ? children : null)
