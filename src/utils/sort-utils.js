import dayjs from 'dayjs';
import { SortType } from '../const.js';

export default class SortUtils {
  static calculateEventDuration(point) {
    if (!point || !point.dateFrom || !point.dateTo) {
      return 0;
    }
    return dayjs(point.dateTo).diff(dayjs(point.dateFrom), 'minute');
  }

  static sortByDay(pointA, pointB) {
    return dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom));
  }

  static sortByTime(pointA, pointB) {
    const durationA = this.calculateEventDuration(pointA);
    const durationB = this.calculateEventDuration(pointB);
    return durationB - durationA || this.sortByDay(pointA, pointB);
  }

  static sortByPrice(pointA, pointB) {
    return pointB.basePrice - pointA.basePrice;
  }

  static sortPoints(points, sortType) {
    if (!points || !points.length) {
      return [];
    }

    const validPoints = points.filter((point) =>
      point && point.dateFrom && point.dateTo
    );

    const sortHandlers = {
      [SortType.DAY]: () => [...validPoints].sort(this.sortByDay),
      [SortType.TIME]: () => [...validPoints].sort(this.sortByTime.bind(this)),
      [SortType.PRICE]: () => [...validPoints].sort(this.sortByPrice)
    };

    const handler = sortHandlers[sortType];
    return handler ? handler() : [...validPoints];
  }
}
