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
      const points = await this.#apiService.points;
      this.#trips = ToClientAdapter.convertPoints(points);
      this.#hasError = false;
      this._notify(UpdateType.INIT);
    } catch (err) {
      this.#trips = [];
      this.#hasError = true;
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

  async addPoint(updateType, point) {
    try {
      const response = await this.#apiService.addPoint(ToServerAdapter.convertPoint(point));
      const newPoint = ToClientAdapter.convertPoint(response);
      this.#trips = [newPoint, ...this.#trips];
      this._notify(updateType, newPoint);
      return newPoint;
    } catch (err) {
      throw new Error('Failed to add point. Please try again.');
    }
  }

  async deletePoint(updateType, point) {
    try {
      await this.#apiService.deletePoint(point.id);
      this.#trips = this.#trips.filter((trip) => trip.id !== point.id);
      this._notify(updateType);
    } catch (err) {
      throw new Error('Failed to delete point. Please try again.');
    }
  }
}
