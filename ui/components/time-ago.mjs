import { DateTime, Interval } from 'luxon'

export const TimeAgoBrief = ({ date }) => {
  const i = Interval.fromDateTimes(DateTime.fromISO(date), DateTime.now())
    .toDuration(['hours', 'days', 'months', 'years'])
    .toObject()
  let ago = ''
  if (i.years < 1 && i.months < 1 && i.days < 1) {
    if (Math.round(i.hours) === 1 || Math.floor(i.hours) === 1) ago += `1 hour ago`
    else if (Math.floor(i.hours) === 0) ago += `recently`
    else ago += `${Math.floor(i.hours)} 'hours ago'`
  } else if (i.years < 1 && i.months < 1) {
    if (Math.floor(i.days) === 1) ago += `1 day ago`
    else if (Math.floor(i.days) === 0) ago += `<1 day ago`
    else ago += `${i.days} days, ${Math.floor(i.hours)} hours ago`
  } else {
    if (i.years === 1) ago += `year ago`
    else if (i.years > 1) ago += `years ago`
    if (i.months === 1) ago += `month ago`
    else if (i.months > 1) ago += `months ago`
  }

  return ago
}

const day = 86400000
const hour = 3600000
const minute = 60000
const second = 1000

export const MsAgo = ({ time }) => {
  const d = Math.floor(Date.now() - time)
  if (d > day) return `${Math.floor(d / day)}d ago`
  if (d > hour) return `${Math.floor(d / hour)}h ago`
  if (d > minute * 2) return `${Math.floor(d / minute)}m ago`
  if (d > second) return `${Math.floor(d / second)}s  ago`
  return `${d}ms ago`
}
