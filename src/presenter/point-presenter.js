import PointView from '../view/point-view.js';
import { render, replace, remove } from '../utils/render-utils.js';
import PointEditView from '../view/point-edit-view.js';
import { UserAction, UpdateType } from '../const.js';

export default class PointPresenter {
  #pointComponent = null;
  #pointEditComponent = null;
  #pointsListContainer = null;
  #destinations = null;
  #offers = null;
  #handleDataChange = null;
  #handleModeChange = null;
  #point = null;
  #isEditFormOpen = false;

  constructor({
    container,
    destinations,
    offers,
    onDataChange,
    onModeChange
  }) {
    this.#pointsListContainer = container;
    this.#destinations = destinations;
    this.#offers = offers;
    this.#handleDataChange = onDataChange;
    this.#handleModeChange = onModeChange;
  }

  init(point) {
    this.#point = point;

    const prevPointComponent = this.#pointComponent;
    const prevPointEditComponent = this.#pointEditComponent;

    this.#pointComponent = new PointView({
      point: this.#point,
      destinations: this.#destinations,
      offers: this.#offers,
      onRollupClick: this.#handleEditClick,
      onFavoriteClick: this.#handleFavoriteClick
    });

    this.#pointEditComponent = new PointEditView({
      point: this.#point,
      destinations: this.#destinations,
      offers: this.#offers,
      onSubmit: this.#handleFormSubmit,
      onRollupClick: this.#handleFormClose,
      onDeleteClick: this.#handleDeleteClick
    });

    if (prevPointComponent === null || prevPointEditComponent === null) {
      render(this.#pointComponent, this.#pointsListContainer);
      return;
    }

    if (this.#isEditFormOpen) {
      replace(this.#pointEditComponent, prevPointEditComponent);
    } else {
      replace(this.#pointComponent, prevPointComponent);
      remove(prevPointEditComponent);
    }
  }

  destroy() {
    remove(this.#pointComponent);
    remove(this.#pointEditComponent);
    document.removeEventListener('keydown', this.#escKeyDownHandler);
  }

  resetView() {
    if (this.#isEditFormOpen) {
      this.#pointEditComponent.reset(this.#point);
      this.#replaceFormToPoint();
    }
  }

  setSaving() {
    if (this.#isEditFormOpen) {
      this.#pointEditComponent.updateElement({
        isSaving: true,
        isDisabled: true
      });
    }
  }

  setDeleting() {
    if (this.#isEditFormOpen) {
      this.#pointEditComponent.updateElement({
        isDeleting: true,
        isDisabled: true
      });
    }
  }

  setAborting() {
    const resetFormState = () => {
      this.#pointEditComponent.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false
      });
    };

    this.#pointEditComponent.shake(resetFormState);
  }

  setDeletingFailed() {
    const resetFormState = () => {
      this.#pointEditComponent.updateElement({
        isDisabled: false,
        isSaving: false,
        isDeleting: false
      });
    };

    this.#pointEditComponent.shake(resetFormState);
  }

  setDisabled() {
    if (this.#isEditFormOpen) {
      this.#pointEditComponent.updateElement({
        isDisabled: true
      });

      // Явно устанавливаем атрибут disabled для всех элементов формы
      const form = document.querySelector('.event.event--edit');
      if (form) {
        const buttons = form.querySelectorAll('button');
        const inputs = form.querySelectorAll('input');

        buttons.forEach((button) => {
          button.disabled = true;
        });

        inputs.forEach((input) => {
          input.disabled = true;
        });
      }
    } else {
      this.#pointComponent.setDisabled(true);
    }
  }

  setEnabled() {
    if (this.#isEditFormOpen) {
      this.#pointEditComponent.updateElement({
        isDisabled: false
      });

      // Явно убираем атрибут disabled для всех элементов формы
      const form = document.querySelector('.event.event--edit');
      if (form) {
        const buttons = form.querySelectorAll('button');
        const inputs = form.querySelectorAll('input');

        buttons.forEach((button) => {
          button.disabled = false;
        });

        inputs.forEach((input) => {
          input.disabled = false;
        });
      }
    } else {
      this.#pointComponent.setDisabled(false);
    }
  }

  #replacePointToForm() {
    replace(this.#pointEditComponent, this.#pointComponent);
    document.addEventListener('keydown', this.#escKeyDownHandler);
    this.#handleModeChange(this.#point.id);
    this.#isEditFormOpen = true;
  }

  #replaceFormToPoint() {
    replace(this.#pointComponent, this.#pointEditComponent);
    document.removeEventListener('keydown', this.#escKeyDownHandler);
    this.#isEditFormOpen = false;
  }

  #escKeyDownHandler = (evt) => {
    if (evt.key === 'Escape' || evt.key === 'Esc') {
      evt.preventDefault();
      this.#pointEditComponent.reset(this.#point);
      this.#replaceFormToPoint();
    }
  };

  #handleEditClick = () => {
    this.#replacePointToForm();
  };

  #handleFormClose = () => {
    this.#pointEditComponent.reset(this.#point);
    this.#replaceFormToPoint();
  };

  #handleFavoriteClick = () => {
    this.#handleDataChange(
      UserAction.UPDATE_POINT,
      UpdateType.PATCH,
      {...this.#point, isFavorite: !this.#point.isFavorite}
    );
  };

  #handleFormSubmit = (update) => {
    this.#handleDataChange(
      UserAction.UPDATE_POINT,
      UpdateType.MINOR,
      update
    );
  };

  #handleDeleteClick = (point) => {
    this.#handleDataChange(
      UserAction.DELETE_POINT,
      UpdateType.MINOR,
      point
    );
  };

  setFavoriteAborting() {
    const resetState = () => {
      this.#pointComponent.updateElement({
        isFavorite: !this.#point.isFavorite
      });
    };

    this.#pointComponent.shake(resetState);
  }
}
