import { SortType } from '../const.js';
import dayjs from 'dayjs';

const Sort = {
  [SortType.DAY]: (points) => [...points].sort(sortPointsByDay),
  [SortType.EVENT]: (points) => points,
  [SortType.TIME]: (points) => [...points].sort(sortPointsByTime),
  [SortType.PRICE]: (points) => [...points].sort(sortPointsByPrice),
  [SortType.OFFER]: (points) => points,
};

function calculateEventDuration(point) {
  return dayjs(point.dateTo).diff(dayjs(point.dateFrom));
}

function sortPointsByDay(pointA, pointB) {
  const dateFromDiff = dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom));

  if (dateFromDiff === 0) {
    return calculateEventDuration(pointB) - calculateEventDuration(pointA);
  }

  return dateFromDiff;
}

function sortPointsByTime(pointA, pointB) {
  const durationA = calculateEventDuration(pointA);
  const durationB = calculateEventDuration(pointB);

  if (durationA === durationB) {
    return dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom));
  }

  return durationB - durationA;
}

function sortPointsByPrice(pointA, pointB) {
  const priceA = pointA.basePrice ?? 0;
  const priceB = pointB.basePrice ?? 0;

  if (priceA === priceB) {
    return dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom));
  }

  return priceB - priceA;
}

export { Sort as sort, sortPointsByDay, sortPointsByTime, sortPointsByPrice };
