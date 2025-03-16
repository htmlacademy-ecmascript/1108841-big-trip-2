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

  get trips() {
    return this.#trips;
  }

  get hasError() {
    return this.#hasError;
  }

  async init() {
    try {
      const points = await this.#apiService.points;
      this.#trips = points;
      this.#hasError = false;
      this._notify(UpdateType.INIT);
    } catch (err) {
      this.#trips = [];
      this.#hasError = true;
      this._notify(UpdateType.ERROR);
      throw new Error('Failed to load latest route information');
    }
  }

  async updatePoint(updateType, updatedPoint) {
    try {
      const updatedServerPoint = await this.#apiService.updatePoint(updatedPoint);
      this.#updatePointInModel(updatedServerPoint, updateType);
      return updatedServerPoint;
    } catch (err) {
      this.#handleApiError('Failed to update point. Please try again.');
    }
  }

  async updateTrip(updateType, updatedPoint) {
    try {
      const updatedServerPoint = await this.#apiService.updatePoint(updatedPoint);
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

  async addPoint(updateType, point) {
    try {
      const newPoint = await this.#apiService.addPoint(point);
      this.#trips = [newPoint, ...this.#trips];
      this._notify(updateType, newPoint);
      return newPoint;
    } catch (err) {
      this.#handleApiError('Failed to add point. Please try again.');
    }
  }

  async deletePoint(updateType, point) {
    try {
      await this.#apiService.deletePoint(point.id);
      this.#trips = this.#trips.filter((trip) => trip.id !== point.id);
      this._notify(updateType);
    } catch (err) {
      this.#handleApiError('Failed to delete point. Please try again.');
    }
  }

  #updatePointInModel(updatedPoint, updateType) {
    const index = this.#trips.findIndex((trip) => trip.id === updatedPoint.id);
    if (index === -1) {
      this.#handleApiError('Failed to update point. Please try again.');
      return;
    }

    this.#trips = [
      ...this.#trips.slice(0, index),
      updatedPoint,
      ...this.#trips.slice(index + 1)
    ];

    this._notify(updateType, updatedPoint);
  }

  #handleApiError(message) {
    this.#hasError = true;
    throw new Error(message);
  }
}
