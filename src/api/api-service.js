import ApiService from '../framework/api-service.js';

export default class PointsApiService extends ApiService {
  constructor(endPoint, authorization) {
    super(endPoint, authorization);
  }

  get points() {
    return this._load({ url: 'points' })
      .then(ApiService.parseResponse);
  }

  get destinations() {
    return this._load({ url: 'destinations' })
      .then(ApiService.parseResponse);
  }

  get offers() {
    return this._load({ url: 'offers' })
      .then(ApiService.parseResponse);
  }

  async updatePoint(point) {
    const response = await this._load({
      url: `points/${point.id}`,
      method: 'PUT',
      body: JSON.stringify(point),
      headers: new Headers({ 'Content-Type': 'application/json' })
    });

    return ApiService.parseResponse(response);
  }

  async addPoint(point) {
    const response = await this._load({
      url: 'points',
      method: 'POST',
      body: JSON.stringify(point),
      headers: new Headers({ 'Content-Type': 'application/json' })
    });

    return ApiService.parseResponse(response);
  }

  async deletePoint(id) {
    return this._load({
      url: `points/${id}`,
      method: 'DELETE',
    });
  }
}
