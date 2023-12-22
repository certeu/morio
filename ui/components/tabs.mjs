import React, { useState, useContext } from 'react'

export const Tabs = ({ tabs = '', active = 0, children }) => {
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
    <div className="my-4">
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
    </div>
  )
}

export const Tab = ({ children, tabId, activeTab }) => (activeTab === tabId ? children : null)
