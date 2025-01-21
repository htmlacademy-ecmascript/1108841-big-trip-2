import FilterView from './view/filter-view.js';
import NewPointButtonView from './view/new-point-button-view.js';
import BoardPresenter from './presenter/board-presenter.js';
import { render } from './render.js';

const siteTripMainElement = document.querySelector('.trip-main');
const siteFiltersElement = siteTripMainElement.querySelector('.trip-controls__filters');
const siteTripEventsElement = document.querySelector('.trip-events');

const boardPresenter = new BoardPresenter(siteTripEventsElement);

render(new FilterView(), siteFiltersElement);
render(new NewPointButtonView(), siteTripMainElement);

boardPresenter.init();

