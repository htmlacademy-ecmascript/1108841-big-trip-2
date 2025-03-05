import { adaptToClient, adaptToServer } from '../api/adapter.js';
import Observable from '../framework/observable.js';

export default class TripsModel extends Observable {
  #trips = [];
  #apiService = null;

  constructor(apiService) {
    super();
    this.#apiService = apiService;
  }

  async init() {
    try {
      const points = await this.#apiService.getPoints();
      this.#trips = adaptToClient.points(points);
    } catch (err) {
      this.#trips = [];
      throw new Error('Не удалось загрузить точки маршрута');
    }
  }

  get trips() {
    return this.#trips;
  }

  /**
   * Обновляет точку маршрута на сервере и в модели
   * @param {UpdateType} updateType - Тип обновления
   * @param {Object} updatedPoint - Обновленная точка маршрута
   * @returns {Promise} - Промис, который разрешается после обновления точки
   */
  async updateTrip(updateType, updatedPoint) {
    try {
      const response = await this.#apiService.updatePoint(adaptToServer.point(updatedPoint));
      const updatedServerPoint = adaptToClient.point(response);

      const index = this.#trips.findIndex((trip) => trip.id === updatedPoint.id);

      if (index === -1) {
        throw new Error('Не удалось обновить несуществующую точку маршрута');
      }

      this.#trips = [
        ...this.#trips.slice(0, index),
        updatedServerPoint,
        ...this.#trips.slice(index + 1)
      ];

      this._notify(updateType, updatedServerPoint);
      return updatedServerPoint;
    } catch (err) {
      throw new Error('Не удалось обновить точку маршрута');
    }
  }

  /**
   * Добавляет новую точку маршрута на сервер и в модель
   * @param {UpdateType} updateType - Тип обновления
   * @param {Object} trip - Новая точка маршрута
   * @returns {Promise} - Промис, который разрешается после добавления точки
   */
  async addTrip(updateType, trip) {
    try {
      const response = await this.#apiService.addPoint(adaptToServer.point(trip));
      const newTrip = adaptToClient.point(response);

      this.#trips = [newTrip, ...this.#trips];

      this._notify(updateType, newTrip);
      return newTrip;
    } catch (err) {
      throw new Error('Не удалось добавить точку маршрута');
    }
  }

  /**
   * Удаляет точку маршрута с сервера и из модели
   * @param {UpdateType} updateType - Тип обновления
   * @param {string} id - ID точки маршрута для удаления
   * @returns {Promise} - Промис, который разрешается после удаления точки
   */
  async deleteTrip(updateType, id) {
    try {
      await this.#apiService.deletePoint(id);

      const index = this.#trips.findIndex((trip) => trip.id === id);

      if (index === -1) {
        throw new Error('Не удалось удалить несуществующую точку маршрута');
      }

      this.#trips = [...this.#trips.slice(0, index), ...this.#trips.slice(index + 1)];

      this._notify(updateType);
      return true;
    } catch (err) {
      throw new Error('Не удалось удалить точку маршрута');
    }
  }
}
