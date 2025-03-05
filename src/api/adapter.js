/**
 * Адаптер для преобразования данных с сервера в формат приложения
 */
export const adaptToClient = {
  /**
   * Преобразует точку маршрута из формата сервера в формат приложения
   * @param {Object} point - Точка маршрута в формате сервера
   * @returns {Object} - Точка маршрута в формате приложения
   */
  point: (point) => ({
    id: point.id,
    basePrice: point.base_price,
    dateFrom: point.date_from,
    dateTo: point.date_to,
    destination: point.destination,
    isFavorite: point.is_favorite,
    offers: point.offers ?? [],
    type: point.type
  }),

  /**
   * Преобразует массив точек маршрута из формата сервера в формат приложения
   * @param {Array} points - Массив точек маршрута в формате сервера
   * @returns {Array} - Массив точек маршрута в формате приложения
   */
  points: (points) => points.map(adaptToClient.point),

  /**
   * Преобразует пункт назначения из формата сервера в формат приложения
   * @param {Object} destination - Пункт назначения в формате сервера
   * @returns {Object} - Пункт назначения в формате приложения
   */
  destination: (destination) => destination,

  /**
   * Преобразует массив пунктов назначения из формата сервера в формат приложения
   * @param {Array} destinations - Массив пунктов назначения в формате сервера
   * @returns {Array} - Массив пунктов назначения в формате приложения
   */
  destinations: (destinations) => destinations,

  /**
   * Преобразует предложения из формата сервера в формат приложения
   * @param {Array} offers - Предложения в формате сервера
   * @returns {Array} - Предложения в формате приложения
   */
  offers: (offers) => offers,
};

/**
 * Адаптер для преобразования данных из формата приложения в формат сервера
 */
export const adaptToServer = {
  /**
   * Преобразует точку маршрута из формата приложения в формат сервера
   * @param {Object} point - Точка маршрута в формате приложения
   * @returns {Object} - Точка маршрута в формате сервера
   */
  point: (point) => {
    // Убедимся, что basePrice - это число
    const basePrice = typeof point.basePrice === 'string'
      ? parseInt(point.basePrice, 10)
      : point.basePrice;

    // Убедимся, что offers - это массив
    const offers = Array.isArray(point.offers) ? point.offers : [];

    return {
      'id': point.id,
      'base_price': Number(basePrice),
      'date_from': point.dateFrom,
      'date_to': point.dateTo,
      'destination': point.destination,
      'is_favorite': Boolean(point.isFavorite),
      'offers': offers,
      'type': point.type
    };
  },
};
