import PointsApiService from './api/api-service.js';
import BoardPresenter from './presenter/board-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import TripInfoPresenter from './presenter/trip-info-presenter.js';
import TripsModel from './model/trips-model.js';
import DestinationsModel from './model/destinations-model.js';
import OffersModel from './model/offers-model.js';
import FilterModel from './model/filter-model.js';
import SortModel from './model/sort-model.js';
import NewPointButtonView from './view/new-point-button-view.js';
import { render } from './utils/render-utils.js';
import { ApiConfig } from './const.js';
import { generateAuthToken } from './utils/common.js';

console.log('Initializing application...');

const tripMainElement = document.querySelector('.trip-main');
const tripEventsElement = document.querySelector('.trip-events');
const filterElement = document.querySelector('.trip-controls__filters');
const newPointButtonElement = document.querySelector('.trip-main');

console.log('DOM elements:', {
  tripMainElement,
  tripEventsElement,
  filterElement,
  newPointButtonElement
});

const authorization = generateAuthToken();
const apiService = new PointsApiService(ApiConfig.BASE_URL, authorization);

console.log('API service initialized with endpoint:', ApiConfig.BASE_URL);

const destinationsModel = new DestinationsModel(apiService);
const offersModel = new OffersModel(apiService);
const tripsModel = new TripsModel(apiService);
const filterModel = new FilterModel();
const sortModel = new SortModel();

console.log('Models created');

const tripInfoPresenter = new TripInfoPresenter({
  container: tripMainElement,
  tripsModel,
  destinationsModel,
  offersModel
});

const boardPresenter = new BoardPresenter({
  container: tripEventsElement,
  destinationsModel,
  offersModel,
  tripsModel,
  filterModel,
  sortModel
});

const filterPresenter = new FilterPresenter({
  container: filterElement,
  filterModel,
  tripsModel,
  boardPresenter
});

// Устанавливаем ссылку на filterPresenter в filterModel
filterModel.setFilterPresenter(filterPresenter);

console.log('Presenters created');

let newPointButtonComponent = null;

const handleNewPointButtonClick = () => {
  boardPresenter.createPoint();
  newPointButtonComponent.element.disabled = true;
};

const renderNewPointButton = () => {
  newPointButtonComponent = new NewPointButtonView({
    onClick: handleNewPointButtonClick
  });
  render(newPointButtonComponent, newPointButtonElement);
  console.log('New point button rendered');
};

(async () => {
  console.log('Starting initialization...');
  boardPresenter.init();
  filterPresenter.init();
  console.log('Initial presenters initialized');

  try {
    console.log('Loading data from API...');
    await Promise.all([
      destinationsModel.init(),
      offersModel.init(),
      tripsModel.init()
    ]);
    console.log('Data loaded successfully');

    boardPresenter.setIsLoading(false);
    boardPresenter.init();
    tripInfoPresenter.init();
    renderNewPointButton();
    console.log('Application fully initialized');
  } catch (err) {
    console.error('Error during initialization:', err);
    boardPresenter.setIsLoading(false);
    boardPresenter.init();
  }
})();
