import FilterView from './view/filter-view.js';
import NewPointButtonView from './view/new-point-button-view.js';
import BoardPresenter from './presenter/board-presenter.js';
import DestinationsModel from './model/destinations-model.js';
import OffersModel from './model/offers-model.js';
import TripsModel from './model/trips-model.js';
import { render } from './framework/render.js';
import { destinations } from './mock/destinations-data.js';
import { offers } from './mock/offers-data.js';
import { points } from './mock/points-data.js';

const mockService = {
  destinations,
  offers,
  trips: points
};

const siteTripMainElement = document.querySelector('.trip-main');
const siteFiltersElement = siteTripMainElement.querySelector('.trip-controls__filters');
const siteTripEventsElement = document.querySelector('.trip-events');

const destinationsModel = new DestinationsModel(mockService);
const offersModel = new OffersModel(mockService);
const tripsModel = new TripsModel(mockService);

const boardPresenter = new BoardPresenter({
  container: siteTripEventsElement,
  destinationsModel,
  offersModel,
  tripsModel
});

render(new FilterView(), siteFiltersElement);
render(new NewPointButtonView(), siteTripMainElement);

boardPresenter.init();

