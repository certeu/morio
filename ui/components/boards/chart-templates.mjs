
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

/*
 * Wrapper templates object with charts, option, and series
 */
export const chartTemplates = {
  charts,
  options,
  series: {
    line: {
      type: 'line',
      symbol: 'none',
      smooth: true,
    },
  },
}
