import DateUtils from './date-utils.js';
import dayjs from 'dayjs';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter.js';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

function isPointFuture(point) {
  return DateUtils.isFuture(point.dateFrom);
}

function isPointPresent(point) {
  const now = dayjs();
  return dayjs(point.dateFrom).isSameOrBefore(now) && dayjs(point.dateTo).isSameOrAfter(now);
}

function isPointPast(point) {
  return DateUtils.isPast(point.dateTo);
}

export { isPointFuture, isPointPresent, isPointPast };
