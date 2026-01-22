import { cloneAsPojo } from 'lib/utils.mjs'
import get from 'lodash/get.js'
import { chartGradient } from 'components/echarts.mjs'

/*
 * Shared chart options
 */
const options = {
  tooltip: {
    trigger: 'axis',
    show: true,
    axisPointer: {
      type: 'line',
      lineStyle: {
        type: 'dashed',
      },
    },
  },
  grid: {
    left: '40',
    right: '50',
    bottom: '80', // Space for legend
    containLabel: true,
  },
  toolbox: {
    feature: {
      saveAsImage: {},
      dataView: {
        backgroundColor: 'var(--morio-bg)',
        textareaColor: 'transparent',
        textColor: 'currentColor',
        buttonColor: 'var(--morio-primary)',
        buttonTextColor: '#fff',
      },
      dataZoom: {},
      magicType: {
        type: ['line', 'bar', 'stack'],
      },
    },
  },
  legend: {
    show: true,
    type: 'scroll',
    bottom: 10,
  },
  dataZoom: [
    {
      type: 'slider',
      show: true,
      xAxisIndex: [0],
      bottom: 40,
      start: 0,
      end: 100,
    },
    {
      type: 'inside',
      xAxisIndex: [0],
    },
  ],
  graphic: [
    {
      type: 'image',
      right: 35,
      top: 72,
      z: 1,
      style: {
        image: '/chartmark.svg',
        width: 75,
        height: 20,
        opacity: 0.25,
      },
    },
  ],
}

/*
 * Shared chart templates
 */
const charts = {
  horbar: {
    ...options,
    title: {
      left: 'center',
      text: 'Set title.text to replace this title',
    },
    xAxis: {
      type: 'value',
      nameLocation: 'middle',
      nameGap: 25,
    },
    yAxis: {
      type: 'category',
      name: 'set yAxis.name to replace this name',
      nameLocation: 'middle',
      nameGap: 20,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
        },
      },
    },
  },
  line: {
    ...options,
    title: {
      left: 'center',
      text: 'Set title.text to replace this title',
    },
    xAxis: {
      type: 'time',
      name: 'Time',
      nameLocation: 'middle',
      nameGap: 45,
      axisLabel: {
        rotate: 45, // Rotate labels for better readability
      },
    },
    yAxis: {
      type: 'value',
      name: 'set yAxis.name to replace this name',
      nameLocation: 'middle',
      nameGap: 30,
      splitLine: {
        show: true,
        lineStyle: {
          type: 'dashed',
        },
      },
    },
  },
}
// Remove datazoom from horbar
delete charts.horbar.toolbox.feature.dataZoom
delete charts.horbar.dataZoom

/*
 * Wrapper templates object with charts, option, and series
 */
export const chartTemplates = {
  charts,
  options,
  series: {
    bar: {
      type: 'bar',
    },
    line: {
      type: 'line',
      symbol: 'none',
      smooth: true,
    },
  },
}

export const markLine = {
  // Average
  avg: (data) => data.reduce((a, b) => a + b) / data.length,
  // Median
  med: (data) => data.sort()[Math.round(data.length / 2)],
  // 95th percentile
  p95: (data) => data.sort()[Math.ceil((95 / 100) * data.length) - 1],
}

/**
 * Helper method for a single-series line chart (by far the most common type)
 *
 *
 * @param {object|array} config - A chart configuration object, or an array of them
 * @param {string} config.id - The ID of the chart. Must be unique and URL-friendly
 * @param {string} config.title - The title of the chart
 * @param {string} config.yName - The label of the Y-axis
 * @param {function} config.yFmt - An optional formatter for the Y-axis labels
 * @param {array} config.series - An array holding the series config
 * @param {string} config.series[0]name - The name to be used on the series
 * @param {string|array} config.series[0]path - The path to the value inside a data entry. Use dot-notation of array as this calls lodash.get() under the hood
 * @param {number} config.series[0]div - Set this to 1 (default) for a simple value, or 30 to calculate the delta per second for an ever increasing counter
 * @param {number} config.series[0]valFmt - On optional transform method to apply to the value in the chart series
 * @return {object|array} options - The Echarts options object, or an array of them
 */
export function lineChart(config, data = false) {
  if (!Array.isArray(config)) config = [config]

  // If we do not have data, return id: title object
  if (!data) {
    const info = {}
    for (const conf of config) info[conf.id] = conf.title
    return info
  }

  const charts = {}
  for (const conf of config) {
    const { id } = conf
    let prev = 0
    charts[id] = {
      ...cloneAsPojo(chartTemplates.charts.line),
      id,
      series: conf.series.map((sconf) => {
        const { div = 1 } = sconf
        const serie = {
          ...chartTemplates.series.line,
          name: sconf.name,
          data: data.map((entry, i) => {
            // If it's a simple value, return early
            if (div === 1) {
              let val = get(entry, sconf.path)
              if (sconf.valFmt) val = sconf.valFmt(val)
              return [entry.timestamp, val]
            } else {
              // If it's a increasing counter, calculate delta
              let val = i === 0 ? 0 : get(entry, sconf.path) - prev
              if (sconf.valFmt) val = sconf.valFmt(val)
              prev = get(entry, sconf.path)
              return [entry.timestamp, val / div]
            }
          }),
        }
        if (div === 30) serie.data[0][1] = serie.data[1][1]
        return serie
      }),
    }
    if (charts[id].series.length === 1)
      charts[id].series[0].areaStyle = {
        opacity: 0.2,
        color: chartGradient('#1b88a2'),
      }
    charts[id].title.text = conf.title
    charts[id].yAxis.name = conf.yName
    if (conf.yFmt) charts[id].yAxis.axisLabel = { formatter: conf.yFmt }
  }

  return charts.length === 1 ? Object.values(charts)[0] : Object.values(charts)
}
