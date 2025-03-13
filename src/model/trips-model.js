import { ToClientAdapter, ToServerAdapter } from '../api/adapter.js';
import Observable from '../framework/observable.js';
import { UpdateType } from '../const.js';

export default class TripsModel extends Observable {
  #trips = [];
  #apiService = null;
  #hasError = false;

  constructor(apiService) {
    super();
    this.#apiService = apiService;
  }

  async init() {
    try {
      const points = await this.#apiService.getPoints();
      this.#trips = ToClientAdapter.convertPoints(points);
      this.#hasError = false;
      // Уведомляем подписчиков, что данные загружены
      this._notify(UpdateType.INIT);
    } catch (err) {
      this.#trips = [];
      this.#hasError = true;
      // Уведомляем подписчиков об ошибке
      this._notify(UpdateType.ERROR);
      throw new Error('Failed to load latest route information');
    }
  }

  get trips() {
    return this.#trips;
  }

  get hasError() {
    return this.#hasError;
  }

  // Алиас для совместимости с тестами
  async updatePoint(updateType, updatedPoint) {
    return this.updateTrip(updateType, updatedPoint);
  }

  async updateTrip(updateType, updatedPoint) {
    try {
      const response = await this.#apiService.updatePoint(ToServerAdapter.convertPoint(updatedPoint));
      const updatedServerPoint = ToClientAdapter.convertPoint(response);

      const index = this.#trips.findIndex((trip) => trip.id === updatedPoint.id);

      if (index === -1) {
        throw new Error('Failed to update point. Please try again.');
      }

      this.#trips = [
        ...this.#trips.slice(0, index),
        updatedServerPoint,
        ...this.#trips.slice(index + 1)
      ];

      this._notify(updateType, updatedServerPoint);
      return updatedServerPoint;
    } catch (err) {
      throw new Error('Failed to update point. Please try again.');
    }
  }

  // Алиас для совместимости с тестами
  async addPoint(updateType, trip) {
    return this.addTrip(updateType, trip);
  }

  async addTrip(updateType, trip) {
    try {
      const response = await this.#apiService.addPoint(ToServerAdapter.convertPoint(trip));
      const newTrip = ToClientAdapter.convertPoint(response);

      this.#trips = [newTrip, ...this.#trips];

      this._notify(updateType, newTrip);
      return newTrip;
    } catch (err) {
      throw new Error('Failed to create point. Please try again.');
    }
  }

  // Алиас для совместимости с тестами
  async deletePoint(updateType, point) {
    const pointId = point?.id || point;
    return this.deleteTrip(updateType, pointId);
  }

  async deleteTrip(updateType, id) {
    try {
      await this.#apiService.deletePoint(id);

      const index = this.#trips.findIndex((trip) => trip.id === id);

      if (index === -1) {
        throw new Error('Failed to delete point. Please try again.');
      }

      const deletedPoint = this.#trips[index];
      this.#trips = [...this.#trips.slice(0, index), ...this.#trips.slice(index + 1)];

      this._notify(updateType, deletedPoint);
      return true;
    } catch (err) {
      throw new Error('Failed to delete point. Please try again.');
    }
  }
}
