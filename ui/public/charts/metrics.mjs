window.morio = window.morio || {}
window.morio.charts = window.morio.charts || {}
window.morio.charts.metrics = {
  'linux-morio-tap': {
    throughput: ({ data, templates }) => {
      /*
       * The throughput metricset has two visualisations:
       * - topics: throughput per topic
       * - processors: throughput per name
       */
      const perTopic = JSON.parse(JSON.stringify(templates.charts.line))
      perTopic.id = 'processors'
      perTopic.title.text = 'Morio Tap Service: Topic troughput'
      perTopic.yAxis.name = 'Events per second'
      perTopic.series = Object.keys(data[0].data.topics).map(name => ({
        ...JSON.parse(JSON.stringify(templates.series.line)),
        name,
        data: data.map(entry => Math.ceil(entry.data.topics[name]/30)),
      }))

      const perProcessor = JSON.parse(JSON.stringify(templates.charts.line))
      perTopic.id = 'topics'
      perProcessor.title.text = 'Morio Tap Service: Processor troughput'
      perProcessor.yAxis.name = 'Events per second'
      perProcessor.series = Object.keys(data[0].data.processors).map(name => ({
        ...JSON.parse(JSON.stringify(templates.series.line)),
        name,
        data: data.map(entry => Math.ceil(entry.data.processors[name]/30)),
      }))

      return [perTopic, perProcessor]
    }
  }
}
