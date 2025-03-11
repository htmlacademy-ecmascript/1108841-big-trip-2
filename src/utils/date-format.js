import { DateFormat, MINUTES_IN_HOUR, HOURS_IN_DAY, TimeUnit, DurationLabel } from '../const.js';
import dayjs from 'dayjs';

function formatDate(date, format) {
  switch (format) {
    case DateFormat.MONTH:
      return dayjs(date).format('MMM');
    case DateFormat.DAY:
      return dayjs(date).format('DD');
    case DateFormat.HOURS_MINUTES:
      return dayjs(date).format('HH:mm');
    case DateFormat.FULL:
      return dayjs(date).format('YYYY MMMM DD HH:mm');
    case DateFormat.DATE_DISPLAY:
      return dayjs(date).format('DD/MM/YY HH:mm');
    case DateFormat.TRIP_INFO:
      return dayjs(date).format('DD MMM').toUpperCase();
    default:
      return date;
  }
}

function getDuration(dateFrom, dateTo) {
  const diff = dayjs(dateTo).diff(dayjs(dateFrom), TimeUnit.MINUTE);

  const minutes = diff % MINUTES_IN_HOUR;
  const hours = Math.floor(diff / MINUTES_IN_HOUR) % HOURS_IN_DAY;
  const days = Math.floor(diff / MINUTES_IN_HOUR / HOURS_IN_DAY);

  if (days > 0) {
    return `${days}${DurationLabel.DAY} ${hours}${DurationLabel.HOUR} ${minutes}${DurationLabel.MINUTE}`;
  }
  if (hours > 0) {
    return `${hours}${DurationLabel.HOUR} ${minutes}${DurationLabel.MINUTE}`;
  }
  return `${minutes}${DurationLabel.MINUTE}`;
}

export { formatDate, getDuration };
