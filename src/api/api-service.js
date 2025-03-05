import ApiService from '../framework/api-service.js';

const ErrorMessages = {
  LOADING_POINTS: 'Не удалось загрузить точки маршрута',
  LOADING_OFFERS: 'Не удалось загрузить предложения',
  LOADING_DESTINATIONS: 'Не удалось загрузить пункты назначения',
  UPDATING_POINT: 'Не удалось обновить точку маршрута',
  ADDING_POINT: 'Не удалось добавить точку маршрута',
  DELETING_POINT: 'Не удалось удалить точку маршрута'
};

export default class PointsApiService extends ApiService {
  constructor(endPoint, authorization) {
    super(endPoint, authorization);
  }

  async getPoints() {
    try {
      const response = await this._load({ url: 'points' });
      return ApiService.parseResponse(response);
    } catch (err) {
      throw new Error(ErrorMessages.LOADING_POINTS);
    }
  }

  async getDestinations() {
    try {
      const response = await this._load({ url: 'destinations' });
      return ApiService.parseResponse(response);
    } catch (err) {
      throw new Error(ErrorMessages.LOADING_DESTINATIONS);
    }
  }

  async getOffers() {
    try {
      const response = await this._load({ url: 'offers' });
      return ApiService.parseResponse(response);
    } catch (err) {
      throw new Error(ErrorMessages.LOADING_OFFERS);
    }
  }

  async updatePoint(point) {
    try {
      const response = await this._load({
        url: `points/${point.id}`,
        method: 'PUT',
        body: JSON.stringify(point),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      return ApiService.parseResponse(response);
    } catch (err) {
      throw new Error(ErrorMessages.UPDATING_POINT);
    }
  }

  async addPoint(point) {
    try {
      const response = await this._load({
        url: 'points',
        method: 'POST',
        body: JSON.stringify(point),
        headers: new Headers({ 'Content-Type': 'application/json' })
      });

      return ApiService.parseResponse(response);
    } catch (err) {
      throw new Error(ErrorMessages.ADDING_POINT);
    }
  }

  async deletePoint(id) {
    try {
      await this._load({
        url: `points/${id}`,
        method: 'DELETE',
      });
    } catch (err) {
      throw new Error(ErrorMessages.DELETING_POINT);
    }
  }
}
