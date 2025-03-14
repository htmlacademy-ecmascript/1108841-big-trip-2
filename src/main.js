import PointsApiService from './api/points-api-service.js';
import DestinationsApiService from './api/destinations-api-service.js';
import OffersApiService from './api/offers-api-service.js';
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

const tripMainElement = document.querySelector('.trip-main');
const tripEventsElement = document.querySelector('.trip-events');
const filterElement = document.querySelector('.trip-controls__filters');
const newPointButtonElement = document.querySelector('.trip-main');
const authorization = generateAuthToken();

// Создаем отдельные API-сервисы для каждого типа данных
const pointsApiService = new PointsApiService(ApiConfig.BASE_URL, authorization);
const destinationsApiService = new DestinationsApiService(ApiConfig.BASE_URL, authorization);
const offersApiService = new OffersApiService(ApiConfig.BASE_URL, authorization);

// Инициализируем модели с соответствующими API-сервисами
const destinationsModel = new DestinationsModel(destinationsApiService);
const offersModel = new OffersModel(offersApiService);
const tripsModel = new TripsModel(pointsApiService);
const filterModel = new FilterModel();
const sortModel = new SortModel();

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

filterModel.setFilterPresenter(filterPresenter);

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
};

(async () => {
  boardPresenter.init();
  filterPresenter.init();
  try {
    await Promise.all([
      destinationsModel.init(),
      offersModel.init(),
      tripsModel.init()
    ]);
    boardPresenter.setIsLoading(false);
    boardPresenter.init();
    tripInfoPresenter.init();
    renderNewPointButton();
  } catch (err) {
    boardPresenter.setIsLoading(false);
    boardPresenter.init();
  }
})();
