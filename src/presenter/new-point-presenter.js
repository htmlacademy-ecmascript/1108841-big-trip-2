import PointEditView from '../view/point-edit-view.js';
import { render, remove } from '../utils/render-utils.js';
import { UserAction, UpdateType, DEFAULT_POINT } from '../const.js';
import {
  isEscapeKey,
  addKeydownHandler,
  removeKeydownHandler,
  setComponentSaving,
  setComponentAborting
} from '../utils/common.js';

export default class NewPointPresenter {
  #pointEditComponent = null;
  #pointsListContainer = null;
  #destinationsModel = null;
  #offersModel = null;
  #handleDataChange = null;
  #handleDestroy = null;

  constructor({
    container = null,
    destinationsModel,
    offersModel,
    onDataChange,
    onDestroy
  }) {
    this.#pointsListContainer = container;
    this.#destinationsModel = destinationsModel;
    this.#offersModel = offersModel;
    this.#handleDataChange = onDataChange;
    this.#handleDestroy = onDestroy;
  }

  setContainer(container) {
    this.#pointsListContainer = container;
  }

  init() {
    if (this.#pointEditComponent !== null) {
      return;
    }

    if (!this.#pointsListContainer) {
      console.error('Container is not set for NewPointPresenter');
      return;
    }

    this.#pointEditComponent = new PointEditView({
      point: {...DEFAULT_POINT},
      destinations: this.#destinationsModel.destinations,
      offers: this.#offersModel.offers,
      onSubmit: this.#handleFormSubmit,
      onRollupClick: this.#handleFormClose,
      onDeleteClick: this.#handleFormClose
    });

    render(this.#pointEditComponent, this.#pointsListContainer, 'afterbegin');
    addKeydownHandler(this.#escKeyDownHandler);
  }

  destroy() {
    if (this.#pointEditComponent === null) {
      return;
    }

    this.#handleDestroy();
    remove(this.#pointEditComponent);
    this.#pointEditComponent = null;
    removeKeydownHandler(this.#escKeyDownHandler);
  }

  setSaving() {
    setComponentSaving(this.#pointEditComponent);
  }

  setAborting() {
    setComponentAborting(this.#pointEditComponent);
  }

  reset() {
    if (this.#pointEditComponent) {
      this.#pointEditComponent.reset(this.#offersModel.offers, this.#destinationsModel.destinations);
    }
  }

  #handleFormSubmit = (point) => {
    this.#handleDataChange(
      UserAction.ADD_POINT,
      UpdateType.MINOR,
      point,
    );
  };

  #handleFormClose = () => {
    this.destroy();
  };

  #escKeyDownHandler = (evt) => {
    if (isEscapeKey(evt)) {
      evt.preventDefault();
      this.destroy();
    }
  };
}
