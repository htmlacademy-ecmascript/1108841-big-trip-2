import AbstractView from '../framework/view/abstract-view.js';
import { ButtonText } from '../const.js';
const createLoadingTemplate = () =>
  `<p class="trip-events__msg">${ButtonText.LOADING}</p>`;
export default class LoadingView extends AbstractView {
  get template() {
    return createLoadingTemplate();
  }
}
