import ApiService from '../framework/api-service.js';
import { ApiErrorMessage } from '../const.js';

export default class PointsApiService extends ApiService {
  constructor(endPoint, authorization) {
    super(endPoint, authorization);
  }

  async getPoints() {
    try {
      const response = await this._load({ url: 'points' });
      return ApiService.parseResponse(response);
    } catch (err) {
      throw new Error(ApiErrorMessage.LOADING_POINTS);
    }
  }

  async getDestinations() {
    try {
      const response = await this._load({ url: 'destinations' });
      return ApiService.parseResponse(response);
    } catch (err) {
      throw new Error(ApiErrorMessage.LOADING_DESTINATIONS);
    }
  }

  async getOffers() {
    try {
      const response = await this._load({ url: 'offers' });
      return ApiService.parseResponse(response);
    } catch (err) {
      throw new Error(ApiErrorMessage.LOADING_OFFERS);
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
      throw new Error(ApiErrorMessage.UPDATING_POINT);
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
      throw new Error(ApiErrorMessage.ADDING_POINT);
    }
  }

  async deletePoint(id) {
    try {
      await this._load({
        url: `points/${id}`,
        method: 'DELETE',
      });
    } catch (err) {
      throw new Error(ApiErrorMessage.DELETING_POINT);
    }
  }
}
