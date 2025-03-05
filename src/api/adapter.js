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
    offers: point.offers,
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
  destination: (destination) => ({
    id: destination.id,
    description: destination.description,
    name: destination.name,
    pictures: destination.pictures
  }),

  /**
   * Преобразует массив пунктов назначения из формата сервера в формат приложения
   * @param {Array} destinations - Массив пунктов назначения в формате сервера
   * @returns {Array} - Массив пунктов назначения в формате приложения
   */
  destinations: (destinations) => destinations.map(adaptToClient.destination),

  /**
   * Преобразует предложение из формата сервера в формат приложения
   * @param {Object} offer - Предложение в формате сервера
   * @returns {Object} - Предложение в формате приложения
   */
  offer: (offer) => ({
    id: offer.id,
    title: offer.title,
    price: offer.price
  }),

  /**
   * Преобразует массив предложений из формата сервера в формат приложения
   * @param {Array} offers - Массив предложений в формате сервера
   * @returns {Array} - Массив предложений в формате приложения
   */
  offers: (offers) => offers.map((offerGroup) => ({
    type: offerGroup.type,
    offers: offerGroup.offers.map(adaptToClient.offer)
  }))
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
    const adaptedPoint = {
      'id': point.id,
      'base_price': parseInt(point.basePrice, 10),
      'date_from': point.dateFrom,
      'date_to': point.dateTo,
      'destination': point.destination,
      'is_favorite': point.isFavorite,
      'offers': point.offers || [],
      'type': point.type
    };

    if (isNaN(adaptedPoint.base_price)) {
      adaptedPoint.base_price = 0;
    }

    if (!Array.isArray(adaptedPoint.offers)) {
      adaptedPoint.offers = [];
    }

    return adaptedPoint;
  },
};
