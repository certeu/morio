import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'
import { Popout } from './popout.mjs'

/*
 * Helper object for styling an axis in Echarts
 */
const axisStyle = {
  axisLine: { show: true, lineStyle: { color: 'currentColor' } },
  axisTick: { show: true, lineStyle: { color: 'currentColor' } },
  axisLabel: { show: true, lineStyle: { color: 'currentColor' } },
}

/*
 * GAR theme (green, amber, red: for status graphs)
 */
echarts.registerTheme('gar', {
  color: [
    'var(--fallback-su,oklch(var(--su)/var(--tw-bg-opacity)))',
    'var(--fallback-wa,oklch(var(--wa)/var(--tw-bg-opacity)))',
    'var(--fallback-er,oklch(var(--er)/var(--tw-bg-opacity)))',
  ],
  backgroundColor: 'transparent',
  title: {
    textStyle: { color: 'currentColor' },
    subtextStyle: { color: 'currentColor' },
  },
  categoryAxis: axisStyle,
  valueAxis: axisStyle,
  logAxis: axisStyle,
  timeAxis: axisStyle,
  legend: {
    textStyle: { color: 'currentColor' },
  },
})

/*
 * MORIO theme (branded graphs)
 * Probably can use some TLC from a designer
 */
echarts.registerTheme('morio', {
  color: [
    'var(--fallback-p,oklch(var(--p)/var(--tw-bg-opacity)))',
    'var(--fallback-s,oklch(var(--s)/var(--tw-bg-opacity)))',
    '#EAB308',
    '#0EA5E9',
    '#EC4899',
    '#10B981',
    'var(--morio-light)',
    '#6366F1',
    '#666',
  ],
  backgroundColor: 'transparent',
  title: {
    textStyle: { color: 'currentColor' },
    subtextStyle: { color: 'currentColor' },
  },
  categoryAxis: axisStyle,
  valueAxis: axisStyle,
  logAxis: axisStyle,
  timeAxis: axisStyle,
  legend: {
    textStyle: { color: 'currentColor' },
  },
})

export const Echart = ({ option = false, theme = 'morio' }) => {
  if (option === false) return null

  return option ? (
    <ReactECharts
      option={option}
      theme={theme}
      style={{ height: 400 }}
      notMerge={true}
      opts={{ renderer: 'svg' }}
    />
  ) : (
    <Popout loading>Loading chart...</Popout>
  )
}
