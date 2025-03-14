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
      body: JSON.stringify(this.#adaptPointToServer(point)),
      headers: new Headers({ 'Content-Type': 'application/json' })
    });

    const parsedResponse = await ApiService.parseResponse(response);
    return this.#adaptPointToClient(parsedResponse);
  }

  async addPoint(point) {
    const response = await this._load({
      url: 'points',
      method: 'POST',
      body: JSON.stringify(this.#adaptPointToServer(point)),
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
    const adaptedPoint = {
      id: point.id,
      basePrice: point.base_price,
      dateFrom: point.date_from,
      dateTo: point.date_to,
      destination: point.destination,
      isFavorite: point.is_favorite,
      offers: point.offers,
      type: point.type
    };

    return adaptedPoint;
  }

  #adaptPointToServer(point) {
    const adaptedPoint = {
      id: point.id,
      'date_from': point.dateFrom,
      'date_to': point.dateTo,
      destination: point.destination,
      'is_favorite': point.isFavorite,
      offers: point.offers || [],
      type: point.type,
      'base_price': isNaN(point.basePrice) || point.basePrice < 0 ? 0 : point.basePrice
    };

    return adaptedPoint;
  }
}
