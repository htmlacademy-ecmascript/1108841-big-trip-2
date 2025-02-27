import { DateFormat, MINUTES_IN_HOUR, FilterType, SortType } from './const.js';
import dayjs from 'dayjs';

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
  switch (format) {
    case DateFormat.MONTH:
      return dayjs(date).format('MMM');
    case DateFormat.DAY:
      return dayjs(date).format('DD');
    case DateFormat.HOURS_MINUTES:
      return dayjs(date).format('HH:mm');
    case DateFormat.FULL:
      return dayjs(date).format('YYYY MMMM DD HH:mm');
    default:
      return date;
  }
}

function getDuration(dateFrom, dateTo) {
  const diff = dayjs(dateTo).diff(dayjs(dateFrom), 'minute');

  const minutes = diff % MINUTES_IN_HOUR;
  const hours = Math.floor(diff / MINUTES_IN_HOUR) % 24;
  const days = Math.floor(diff / MINUTES_IN_HOUR / 24);

  if (days > 0) {
    return `${days}D ${hours}H ${minutes}M`;
  }
  if (hours > 0) {
    return `${hours}H ${minutes}M`;
  }
  return `${minutes}M`;
}

function isPointFuture(point) {
  return dayjs(point.dateFrom).isAfter(dayjs());
}

function isPointPresent(point) {
  const now = dayjs();
  return dayjs(point.dateFrom).isBefore(now) && dayjs(point.dateTo).isAfter(now);
}

function isPointPast(point) {
  return dayjs(point.dateTo).isBefore(dayjs());
}

function sortPointsByDay(pointA, pointB) {
  return dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom));
}

function sortPointsByTime(pointA, pointB) {
  const durationA = dayjs(pointA.dateTo).diff(dayjs(pointA.dateFrom));
  const durationB = dayjs(pointB.dateTo).diff(dayjs(pointB.dateFrom));
  return durationB - durationA;
}

function sortPointsByPrice(pointA, pointB) {
  return pointB.basePrice - pointA.basePrice;
}

const sort = {
  [SortType.DAY]: (points) => points.sort(sortPointsByDay),
  [SortType.EVENT]: (points) => points,
  [SortType.TIME]: (points) => points.sort(sortPointsByTime),
  [SortType.PRICE]: (points) => points.sort(sortPointsByPrice),
  [SortType.OFFER]: (points) => points,
};

const filter = {
  [FilterType.EVERYTHING]: (points) => points,
  [FilterType.FUTURE]: (points) => points.filter(isPointFuture),
  [FilterType.PRESENT]: (points) => points.filter(isPointPresent),
  [FilterType.PAST]: (points) => points.filter(isPointPast),
};

function generateFilters(points) {
  return {
    [FilterType.EVERYTHING]: true,
    [FilterType.FUTURE]: filter[FilterType.FUTURE](points).length > 0,
    [FilterType.PRESENT]: filter[FilterType.PRESENT](points).length > 0,
    [FilterType.PAST]: filter[FilterType.PAST](points).length > 0,
  };
}

export {
  getRandomArrayElement,
  capitalizeFirstLetter,
  formatDate,
  getDuration,
  filter,
  generateFilters,
  sort
};
