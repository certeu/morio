import { wordmarkPathString } from 'components/branding.mjs'

/*
 * Helper method to format time on charts
 */
const chartTime = (timestamp) => {
  const date = new Date(timestamp)
  const hours = date.getHours()
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`
}

/*
 * Helper method to pad a string to a length of 2
 * This is used for hours, minutes, seconds
 */
const pad2 = (str) => `${str}`.length === 2 ? str : '0'+str


/*
 * Shared chart options
 */
const options = {
  tooltip: {
    trigger: 'axis',
    show: true,
    axisPointer: {
      type: "line",
      lineStyle: {
        type: "dashed"
      }
    }
  },
  grid: {
    left: "3%",
    right: "4%",
    bottom: "80", // Space for legend
    containLabel: true
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
        type: ['line', 'bar', 'stack']
      },
    }
  },
  legend: {
    show: true,
    type: 'scroll',
    bottom: 10,
  },
  dataZoom: [
    {
      type: "slider",
      show: true,
      xAxisIndex: [0],
      bottom: 40,
      start: 0,
      end: 100
    },
    {
      type: "inside",
      xAxisIndex: [0]
    }
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
      }
    }
  ]
}

/*
 * Shared chart templates
 */
const charts = (data) => ({
  line: {
    ...options,
    title: {
      left: 'center',
      text: 'Set title.text to replace this title',
    },
    xAxis: {
      type: 'category',
      name: 'Time',
      nameLocation: "middle",
      nameGap: 45,
      axisLabel: {
        rotate: 45  // Rotate labels for better readability
      },
      data: data.map(entry => chartTime(entry.timestamp)),
    },
    yAxis: {
      type: 'value',
      name: 'set yAxis.name to replace this name',
      nameLocation: "middle",
      nameGap: 30,
      splitLine: {
        show: true,
        lineStyle: {
          type: "dashed"
        },
      }
    },
  }
})

/*
 * Shared chart series templates
 */
const series = {
  line: {
    type: 'line',
    symbol: 'none',
    smooth: true,
  }
}

/*
 * Wrapper templates object with charts, option, and series
 */
export const chartTemplates = (data) => ({
  charts: JSON.parse(JSON.stringify(charts(data))),
  options: JSON.parse(JSON.stringify(options)),
  series: {
    line: {
      type: 'line',
      symbol: 'none',
      smooth: true,
    },
  }
})

