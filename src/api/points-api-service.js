import ApiService from '../framework/api-service.js';

export default class PointsApiService extends ApiService {
  constructor(endPoint, authorization) {
    super(endPoint, authorization);
  }

  get points() {
    return this._load({ url: 'points' })
      .then(ApiService.parseResponse)
      .then((points) => points.map((point) => this.#adaptPointToClient(point)));
  }

  async updatePoint(point) {
    const response = await this._load({
      url: `points/${point.id}`,
      method: 'PUT',
      body: JSON.stringify(this.#adaptPointToServer(point, true)),
      headers: new Headers({ 'Content-Type': 'application/json' })
    });

    const parsedResponse = await ApiService.parseResponse(response);
    return this.#adaptPointToClient(parsedResponse);
  }

  async addPoint(point) {
    const response = await this._load({
      url: 'points',
      method: 'POST',
      body: JSON.stringify(this.#adaptPointToServer(point, false)),
      headers: new Headers({ 'Content-Type': 'application/json' })
    });

    const parsedResponse = await ApiService.parseResponse(response);
    return this.#adaptPointToClient(parsedResponse);
  }

  async deletePoint(id) {
    return this._load({
      url: `points/${id}`,
      method: 'DELETE',
    });
  }

  #adaptPointToClient(point) {
    const {
      id,
      base_price: basePrice,
      date_from: dateFrom,
      date_to: dateTo,
      destination,
      is_favorite: isFavorite,
      offers,
      type
    } = point;

    return {
      id,
      basePrice,
      dateFrom,
      dateTo,
      destination,
      isFavorite,
      offers,
      type
    };
  }

  #adaptPointToServer(point, isExisting) {
    const {
      dateFrom,
      dateTo,
      destination,
      isFavorite,
      type
    } = point;

    let basePrice = parseInt(point.basePrice, 10);
    if (isNaN(basePrice) || basePrice < 1) {
      basePrice = 1;
    }

    const offers = Array.isArray(point.offers) ? point.offers : [];

    const normalizedDateFrom = dateFrom || new Date().toISOString();
    let normalizedDateTo = dateTo || new Date(Date.now() + 3600000).toISOString();

    const dateFromMs = new Date(normalizedDateFrom).getTime();
    const dateToMs = new Date(normalizedDateTo).getTime();

    if (dateFromMs >= dateToMs) {
      normalizedDateTo = new Date(dateFromMs + 3600000).toISOString();
    }

    const serverData = {
      'date_from': normalizedDateFrom,
      'date_to': normalizedDateTo,
      destination: destination || '',
      'is_favorite': typeof isFavorite === 'boolean' ? isFavorite : false,
      offers,
      type: type || 'flight',
      'base_price': basePrice
    };

    if (isExisting && point.id) {
      serverData.id = point.id;
    }

    return serverData;
  }
}
