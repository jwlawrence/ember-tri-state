import Component from '@ember/component';
import EmberObject, { computed } from '@ember/object';
import PromiseProxyMixin from '@ember/object/promise-proxy-mixin';
import { typeOf } from '@ember/utils';
import RSVP from 'rsvp';
import layout from 'ember-tri-state/templates/components/tri-state';

const PromiseObject = EmberObject.extend(PromiseProxyMixin);

/**
 * The purpose of this component is to handle the conditional rendering of components based on the
 * state of one or more batched promises. Depending on the state of the promises the component will
 * render one of three yielded components: loading, error, or success.
 *
 * Attributes accepted by this component:
 * --------------------------------------
 * promises           {Promise|Array|Object}- One or more promises
 * showLastSuccessful {Boolean}             - If true, display the last successful data instead of
 *                                            the loading or error component when fetching new data
 * forceResolveAll    {Boolean}             - Fulfill `promise` regardless of whether any of the
 *                                            batched `promises` reject.
 * onFulfilledData    {Function}            - Callback called when promise is fulfilled
 * onRejected         {Function}            - Callback called when promise is rejected
 * onSettled          {Function}            - Callback called when promise is settled
 * noopComponent      {String}              - Component used when not rendering a state
 * yieldComponent     {String}              - Component used when rendering any state by default
 * loadingComponent   {String}              - Override `yieldComponent` when rendering loading state
 * errorComponent     {String}              - Override `yieldComponent` when rendering error state
 * successComponent   {String}              - Override `yieldComponent` when rendering success state
 *
 * @module  components/tri-state
 */
export default Component.extend({
  layout,
  tagName: '',

  /**
   * Computes component state based on the promise state and associated data
   * @param {String} promiseState The derived state of the promises
   * @param {*} data The associated data
   * @private
   */
  triState: computed('promise.isPending', function () {
    const canShowLastSuccessful = this.get('showLastSuccessful') && this.get('_lastResolvedData');
    const willRenderLoadingComponent = this.get('promise.isPending') && !canShowLastSuccessful;
    const willRenderErrorComponent = this.get('promise.isRejected') &&
                                     !canShowLastSuccessful &&
                                     !this.get('forceResolveAll');
    const willRenderSuccessComponent = this.get('promise.isFulfilled') ||
                                       (this.get('promise.isPending') && canShowLastSuccessful);

    return {
      error: {
        isActive: this.get('promise.isRejected'),
        component: willRenderErrorComponent ? this.errorComponent : this.noopComponent,
        data: willRenderErrorComponent ? this.get('promise.reason') : null,
      },
      success: {
        isActive: this.get('promise.isFulfilled'),
        component: willRenderSuccessComponent ? this.successComponent : this.noopComponent,
        data: willRenderSuccessComponent ? this.get('_lastResolvedData') : null,
      },
      loading: {
        isActive: this.get('promise.isPending'),
        component: willRenderLoadingComponent ? this.loadingComponent : this.noopComponent,
      },
    };
  }),

  /**
   * Helper function to resolve promises based on how they are provided
   * @param {Promise|Array|Object} promises The promises to resolve
   * @return {Promise} Promise which resolves when all promises have resolved
   * @private
   */
  _resolvePromises(promises) {
    if (promises && typeof promises.then === 'function') {
      return promises;
    }

    if (Array.isArray(promises)) {
      if (this.get('forceResolveAll')) {
        return RSVP.allSettled(promises);
      }
      return RSVP.all(promises);
    }

    if (typeOf(promises) === 'object') {
      if (this.get('forceResolveAll')) {
        return RSVP.hashSettled(promises);
      }
      return RSVP.hash(promises);
    }

    return RSVP.Promise.resolve(promises);
  },

  /**
   * Set defaults and resolve `promise` once we have attributes
   */
  didReceiveAttrs() {
    this._super(...arguments);

    /**
     * Cached data from the last fulfilled promise to use when `showLastSuccessful` is true
     * @type {*}
     * @private
     */
    this._lastResolvedData = this._lastResolvedData || null;

    /**
     * One or more actions that each return a promise.
     * @type {Promise|Object|Array}
     */
    this.promises = this.get('promises');

    /**
     * If true, display the last successful data instead of the loading or error state when
     * fetching new data.
     * @type {Boolean}
     * @default false
     */
    this.showLastSuccessful = this.getWithDefault('showLastSuccessful', false);

    /**
     * Fulfill `promise`, even if one or more batched `promises` fail
     * @type {Boolean}
     * @default false
     */
    this.forceResolveAll = this.getWithDefault('forceResolveAll', false);

    /**
     * Name of the component to render when any state is inactive.
     * @type {String}
     * @default 'tri-noop'
     */
    this.noopComponent = this.getWithDefault('noopComponent', 'tri-noop');

    /**
     * Name of the component to render when any state is active, unless overridden.
     * @type {String}
     * @default 'tri-yield'
     */
    this.yieldComponent = this.getWithDefault('yieldComponent', 'tri-yield');

    /**
     * Name of the component to render when the error state is active.
     * @type {String}
     * @default 'tri-yield'
     */
    this.errorComponent = this.getWithDefault('errorComponent', this.yieldComponent);

    /**
     * Name of the component to render when the success state is active.
     * @type {String}
     * @default 'tri-yield'
     */
    this.successComponent = this.getWithDefault('successComponent', this.yieldComponent);

    /**
     * Name of the component to render when the loading state is active.
     * @type {String}
     * @default 'tri-yield'
     */
    this.loadingComponent = this.getWithDefault('loadingComponent', this.yieldComponent);

    /**
     * Callback called when the promise has been fulfilled
     * @type {Function}
     * @default noop
     */
    this.onFulfilledData = this.getWithDefault('onFulfilledData', () => {});

    /**
     * Callback called when the promise has been rejected
     * @type {Function}
     * @default noop
     */
    this.onRejected = this.getWithDefault('onRejected', () => {});

    /**
     * Callback called when the promise has been settled
     * @type {Function}
     * @default noop
     */
    this.onSettled = this.getWithDefault('onSettled', () => {});

    // Wrap `promises` into a single promise
    const promise = this._resolvePromises(this.get('promises'));

    // Create a promise proxy object that is state aware
    this.set('promise', PromiseObject.create({ promise }));

    // Resolve promise
    this.get('promise')
      .then((data) => {
        // cache successful data
        this._lastResolvedData = data;
        this.onFulfilledData(data);
      })
      .catch(this.onRejected)
      .finally(this.onSettled);
  },
});
