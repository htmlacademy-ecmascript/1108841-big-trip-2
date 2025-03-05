import PointsApiService from './api/api-service.js';
import BoardPresenter from './presenter/board-presenter.js';
import FilterPresenter from './presenter/filter-presenter.js';
import TripsModel from './model/trips-model.js';
import DestinationsModel from './model/destinations-model.js';
import OffersModel from './model/offers-model.js';
import FilterModel from './model/filter-model.js';
import SortModel from './model/sort-model.js';
import NewPointButtonView from './view/new-point-button-view.js';
import { render } from './framework/render.js';

const END_POINT = 'https://23.objects.htmlacademy.pro/big-trip';
const AUTHORIZATION = 'Basic kTy9gIdsz2317rD';

const tripEventsElement = document.querySelector('.trip-events');
const filterElement = document.querySelector('.trip-controls__filters');
const newPointButtonContainer = document.querySelector('.trip-main');

const apiService = new PointsApiService(END_POINT, AUTHORIZATION);

const destinationsModel = new DestinationsModel(apiService);
const offersModel = new OffersModel(apiService);
const tripsModel = new TripsModel(apiService);
const filterModel = new FilterModel();
const sortModel = new SortModel();

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
  tripsModel
});

let newPointButtonComponent = null;

const handleNewPointButtonClick = () => {
  boardPresenter.createPoint();
  newPointButtonComponent.element.disabled = true;
};

const renderNewPointButton = () => {
  newPointButtonComponent = new NewPointButtonView({
    onClick: handleNewPointButtonClick
  });
  render(newPointButtonComponent, newPointButtonContainer);
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
    renderNewPointButton();
  } catch (err) {
    boardPresenter.setIsLoading(false);
    boardPresenter.renderError('Не удалось загрузить данные. Пожалуйста, попробуйте позже.');
    // eslint-disable-next-line no-console
    console.error('Ошибка при инициализации приложения:', err);
  }
})();
