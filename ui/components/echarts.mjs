import * as echarts from 'echarts'
import ReactECharts from 'echarts-for-react'

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
    'var(--fallback-su,oklch(var(--su)))',
    'var(--fallback-wa,oklch(var(--wa)))',
    'var(--fallback-er,oklch(var(--er)))',
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
 * Note: You cannot use CSS vars here, it will break the graph on hover
 */
echarts.registerTheme('morio', {
  color: [
    '#1B88A2',
    '#14B8A6',
    '#EAB308',
    '#0EA5E9',
    '#EC4899',
    '#10B981',
    '#8ECAE6',
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

export const Echart = (props) => {
  const { option = false, theme = 'morio' } = props
  if (option === false) return null

  return (
    <ReactECharts
      option={option}
      theme={theme}
      style={{ height: 450 }}
      notMerge={true}
      opts={{ renderer: 'svg' }}
    />
  )
}
