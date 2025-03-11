import { SortType } from '../const.js';
import dayjs from 'dayjs';

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

export { sort, sortPointsByDay, sortPointsByTime, sortPointsByPrice };
