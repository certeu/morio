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
