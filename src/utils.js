import { DateFormat, MINUTES_IN_HOUR } from './const.js';

function getRandomArrayElement(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function capitalizeFirstLetter(word) {
  if (!word) {
    return '';
  }
  return word[0].toUpperCase() + word.slice(1);
}

function formatDate(date, format) {
  const dateObj = new Date(date);

  switch (format) {
    case DateFormat.MONTH:
      return dateObj.toLocaleString('en-US', { month: 'short' });
    case DateFormat.DAY:
      return dateObj.getDate().toString().padStart(2, '0');
    case DateFormat.HOURS_MINUTES:
      return dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    case DateFormat.FULL:
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    default:
      return date;
  }
}

function getDuration(dateFrom, dateTo) {
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  const diff = end - start;

  const minutes = Math.floor(diff / 1000 / 60);
  const hours = Math.floor(minutes / MINUTES_IN_HOUR);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}D ${hours % 24}H ${minutes % MINUTES_IN_HOUR}M`;
  }
  if (hours > 0) {
    return `${hours}H ${minutes % MINUTES_IN_HOUR}M`;
  }
  return `${minutes}M`;
}

export { getRandomArrayElement, capitalizeFirstLetter, formatDate, getDuration };
