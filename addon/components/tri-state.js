import Ember from 'ember';
import layout from 'ember-tri-state/templates/components/tri-state';

const { Component, isEmpty, isPresent, RSVP, run } = Ember;

const STATE = Object.freeze({
  NONE: 'NONE',
  LOADING: 'LOADING',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
});

/**
 * The purpose of this component is to handle the conditional rendering of components based on the state
 * of one or more batched promises. Depending on the state of the promises the component will render one
 * of three yielded components: loading, error, or success.
 *
 * Attributes accepted by this component:
 * --------------------------------------
 * promises           {String|Array|Object} - One or more promises to compute component state from
 * showLastSuccessful {Boolean}             - If true, display the last successful data instead of
 *                                            the loading or error component when fetching new data
 * noopComponent      {String}              - Component used when not rendering a state
 * yieldComponent     {String}              - Component used when rendering any state by default
 * loadingComponent   {String}              - Override 'yieldComponent' when rendering loading state
 * errorComponent     {String}              - Override 'yieldComponent' when rendering error state
 * successComponent   {String}              - Override 'yieldComponent' when rendering success state
 *
 * @module  components/tri-state
 */
export default Component.extend({
  layout,

  /**
   * Cache for the last resolved data to be shown during requests when showLastSuccessful is true
   * @type {*}
   * @private
   */
  _lastResolvedData: null,

  /**
   * Helper function to resolve promises based on how they are provided
   * @param {Promise|Array|Object} promises The promises to resolve
   * @return {Promise} Promise which resolves when all promises have resolved
   * @private
   */
  _resolvePromises(promises) {
    if (promises instanceof Promise) {
      return promises;
    }

    if (Array.isArray(promises)) {
      return RSVP.all(promises);
    }

    if (typeof promises === 'object') {
      return RSVP.hash(promises);
    }

    return promises;
  },

  /**
   * Computes promise state after all promises are either resolved or rejected
   * @return {Array} Array containing the promise state and data associated with the promise state
   * @private
   */
  _computePromiseState() {
    const promises = this.get('promises');

    return this._resolvePromises(promises).then((data) => {
      return [STATE.RESOLVED, data];
    }, (reason) => {
      return [STATE.REJECTED, reason];
    });
  },

  /**
   * Computes component state based on the promise state and associated data
   * @param {String} promiseState The derived state of the promises
   * @param {*} data The associated data
   * @private
   */
  _setComponentState(promiseState, data = this._lastResolvedData) {
    const canShowLastSuccessful = (this.showLastSuccessful === true) && isPresent(data);
    const willRenderSuccessComponent = promiseState === STATE.RESOLVED || ((promiseState === STATE.LOADING) && canShowLastSuccessful);
    const willRenderLoadingComponent = (promiseState === STATE.LOADING) && !canShowLastSuccessful;

    this.set('componentState', {
      error: {
        isActive: promiseState === STATE.REJECTED,
        component: promiseState === STATE.REJECTED ? this.errorComponent : this.noopComponent,
        data: promiseState === STATE.REJECTED ? data : null,
      },
      success: {
        isActive: promiseState === STATE.RESOLVED,
        component: willRenderSuccessComponent ? this.successComponent : this.noopComponent,
        data: willRenderSuccessComponent ? data : null,
      },
      loading: {
        isActive: promiseState === STATE.LOADING,
        component: willRenderLoadingComponent ? this.loadingComponent : this.noopComponent,
      },
    });
  },

  /**
   * Set defaults and request data once we have attributes
   */
  didReceiveAttrs() {
    this._super(...arguments);

    /**
     * One or more actions that each return a promise.
     * @type {Promise|Object|Array}
     */
    this.promises = this.get('promises');

    /**
     * If true, display the last successful data instead of the loading or error state when
     * fetching new data.
     * @type {Boolean}
     */
    this.showLastSuccessful = this.getWithDefault('showLastSuccessful', false);

    /**
     * Name of the component to render when any state is inactive.
     * @type {String}
     */
    this.noopComponent = this.getWithDefault('noopComponent', 'tri-noop');

    /**
     * Name of the component to render when any state is active, unless overridden.
     * @type {String}
     */
    this.yieldComponent = this.getWithDefault('yieldComponent', 'tri-yield');

    /**
     * Name of the component to render when the error state is active.
     * @type {String}
     */
    this.errorComponent = this.getWithDefault('errorComponent', this.yieldComponent);

    /**
     * Name of the component to render when the success state is active.
     * @type {String}
     */
    this.successComponent = this.getWithDefault('successComponent', this.yieldComponent);

    /**
     * Name of the component to render when the loading state is active.
     * @type {String}
     */
    this.loadingComponent = this.getWithDefault('loadingComponent', this.yieldComponent);

    // If there are no promises to act upon fallback to last resolved data or exit with no state
    if (isEmpty(this.promises)) {
      if (isPresent(this._lastResolvedData) && (this.showLastSuccessful === true)) {
        this._setComponentState(STATE.RESOLVED);
      }
      return this._setComponentState(STATE.NONE);
    }

    // If there are some promises assume loading state
    this._setComponentState(STATE.LOADING);

    // Once the promises settle then cache resolved data and set the final state
    this._computePromiseState().then(([promiseState, data]) => {
      if (promiseState === STATE.RESOLVED) {
        this._lastResolvedData = data;
        this.sendAction('onResolvedData', data);
      }

      run.next(() => {
        this._setComponentState(promiseState, data)
      });
    });
  },
});
