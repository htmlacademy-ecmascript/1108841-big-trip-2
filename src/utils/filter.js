import { FilterType } from '../const.js';
import dayjs from 'dayjs';

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

export { filter, generateFilters, isPointFuture, isPointPresent, isPointPast };
