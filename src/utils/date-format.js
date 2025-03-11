import { DateFormat, TimeConfig, TimeUnit, DurationLabel } from '../const.js';
import dayjs from 'dayjs';

const formatters = {
  [DateFormat.MONTH]: (date) => dayjs(date).format('MMM'),
  [DateFormat.DAY]: (date) => dayjs(date).format('DD'),
  [DateFormat.HOURS_MINUTES]: (date) => dayjs(date).format('HH:mm'),
  [DateFormat.FULL]: (date) => dayjs(date).format('YYYY MMMM DD HH:mm'),
  [DateFormat.DATE_DISPLAY]: (date) => dayjs(date).format('DD/MM/YY HH:mm'),
  [DateFormat.TRIP_INFO]: (date) => dayjs(date).format('DD MMM').toUpperCase(),
  DEFAULT: (date, format) => {
    if (typeof format === 'string') {
      return dayjs(date).format(format);
    }
    return String(date);
  }
};

function formatDate(date, format) {
  if (!date) {
    return '';
  }

  // Если для указанного формата есть функция форматирования, используем её
  const formatter = formatters[format] || formatters.DEFAULT;
  return formatter(date, format);
}

function calculateDuration(dateFrom, dateTo) {
  const diff = dayjs(dateTo).diff(dayjs(dateFrom), TimeUnit.MINUTE);

  const minutes = diff % TimeConfig.MINUTES_IN_HOUR;
  const hours = Math.floor(diff / TimeConfig.MINUTES_IN_HOUR) % TimeConfig.HOURS_IN_DAY;
  const days = Math.floor(diff / TimeConfig.MINUTES_IN_HOUR / TimeConfig.HOURS_IN_DAY);

  if (days > 0) {
    return `${days}${DurationLabel.DAY} ${hours}${DurationLabel.HOUR} ${minutes}${DurationLabel.MINUTE}`;
  }
  if (hours > 0) {
    return `${hours}${DurationLabel.HOUR} ${minutes}${DurationLabel.MINUTE}`;
  }
  return `${minutes}${DurationLabel.MINUTE}`;
}

export { formatDate, calculateDuration };
