import dayjs from 'dayjs';
import { SortType } from '../const.js';

/**
 * Класс для работы с сортировкой точек маршрута
 */
export default class SortUtils {
  /**
   * Вычисляет продолжительность события в минутах
   * @param {Object} point - Точка маршрута
   * @returns {number} Продолжительность в минутах
   */
  static calculateEventDuration(point) {
    if (!point || !point.dateFrom || !point.dateTo) {
      return 0;
    }
    return dayjs(point.dateTo).diff(dayjs(point.dateFrom), 'minute');
  }

  /**
   * Сортирует точки маршрута по дате начала
   * @param {Object} pointA - Первая точка маршрута
   * @param {Object} pointB - Вторая точка маршрута
   * @returns {number} Результат сравнения
   */
  static sortByDay(pointA, pointB) {
    return dayjs(pointA.dateFrom).diff(dayjs(pointB.dateFrom));
  }

  /**
   * Сортирует точки маршрута по продолжительности (от большей к меньшей)
   * @param {Object} pointA - Первая точка маршрута
   * @param {Object} pointB - Вторая точка маршрута
   * @returns {number} Результат сравнения
   */
  static sortByTime(pointA, pointB) {
    const durationA = this.calculateEventDuration(pointA);
    const durationB = this.calculateEventDuration(pointB);
    return durationB - durationA || this.sortByDay(pointA, pointB);
  }

  /**
   * Сортирует точки маршрута по цене (от большей к меньшей)
   * @param {Object} pointA - Первая точка маршрута
   * @param {Object} pointB - Вторая точка маршрута
   * @returns {number} Результат сравнения
   */
  static sortByPrice(pointA, pointB) {
    return pointB.basePrice - pointA.basePrice;
  }

  /**
   * Сортирует точки маршрута в соответствии с указанным типом сортировки
   * @param {Array} points - Массив точек маршрута
   * @param {string} sortType - Тип сортировки
   * @returns {Array} Отсортированный массив точек маршрута
   */
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
