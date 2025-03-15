import { DateFormat, TimeConfig, TimeUnit, DurationLabel } from '../const.js';
import dayjs from 'dayjs';

export default class DateUtils {
  static #formatters = {
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

  static formatDate(date, format) {
    if (!date) {
      return '';
    }
    const formatter = this.#formatters[format] || this.#formatters.DEFAULT;
    return formatter(date, format);
  }

  static calculateDuration(dateFrom, dateTo) {
    const diff = dayjs(dateTo).diff(dayjs(dateFrom), TimeUnit.MINUTE);
    const minutes = diff % TimeConfig.MINUTES_IN_HOUR;
    const hours = Math.floor(diff / TimeConfig.MINUTES_IN_HOUR) % TimeConfig.HOURS_IN_DAY;
    const days = Math.floor(diff / TimeConfig.MINUTES_IN_HOUR / TimeConfig.HOURS_IN_DAY);

    const formattedDays = String(days).padStart(2, '0');
    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    if (days > 0) {
      return `${formattedDays}${DurationLabel.DAY} ${formattedHours}${DurationLabel.HOUR} ${formattedMinutes}${DurationLabel.MINUTE}`;
    }

    if (hours > 0) {
      return `${formattedHours}${DurationLabel.HOUR} ${formattedMinutes}${DurationLabel.MINUTE}`;
    }

    return `${formattedMinutes}${DurationLabel.MINUTE}`;
  }

  static isPast(date) {
    return dayjs(date).isBefore(dayjs(), 'day');
  }

  static isPresent(date) {
    return dayjs(date).isSame(dayjs(), 'day');
  }

  static isFuture(date) {
    return dayjs(date).isAfter(dayjs(), 'day');
  }
}
