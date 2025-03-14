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

  #adaptPointToServer(point) {
    const {
      id,
      dateFrom,
      dateTo,
      destination,
      isFavorite,
      type
    } = point;

    const basePrice = isNaN(point.basePrice) || point.basePrice < 0 ? 0 : point.basePrice;
    const offers = point.offers || [];

    return {
      id,
      'date_from': dateFrom,
      'date_to': dateTo,
      destination,
      'is_favorite': isFavorite,
      offers,
      type,
      'base_price': basePrice
    };
  }
}
