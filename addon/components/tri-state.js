import Ember from 'ember';
import layout from 'ember-tri-state/templates/components/tri-state';
import { task } from 'ember-concurrency';

const { Component, computed, inject, isBlank, K: noop, Logger, merge, RSVP, typeOf } = Ember;

/**
 * The purpose of this component is to handle the conditional rendering of components based on the
 * state of one or more batched data requests. Depending on the state of the request the
 * component will render one of three yielded components: loading, error, or success. An 'actions'
 * object is also yielded to the template allowing manipulation of the data.
 *
 * Attributes accepted by this component:
 * --------------------------------------
 * dataActions        {string|array|object} - One or more actions that each return a promise.
 * failFast           {Boolean}             - Reject request immediately if any of the promises
 *                                            do not successfully resolve a value.
 * showLastSuccessful {Boolean}             - If true, display the last successful data instead of
 *                                            the loading or error component when fetching new data.
 * listenForEvents    {Boolean}             - Register an event listener for 'update' events
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
   * A service that is event aware so we can trigger actions in tri-state from external sources.
   * Note this is NOT RECOMMENDED as it goes against DDAU and has the potential to introduce memory
   * leaks if we don't clean up after ourselves. However, it can be useful in certain situations.
   * @type {Object}
   */
  triEvents: inject.service(),

  /**
   * Flag used to indicate if we should wait for all promises to resolve or
   * if we should reject immediately as soon as one fails.
   * @type {Boolean}
   */
  resolveAll: computed.not('failFast'),

  /**
   * Task aliases
   */
  isLoading: computed.alias('taskInstance.isRunning'),
  isError: computed.bool('taskInstance.error'),
  isSuccess: computed.bool('taskInstance.value'),
  lastSuccessValue: computed.alias('_fetchDataTask.lastSuccessful.value'),
  hasSuccessData: computed.bool('lastSuccessValue'),

  /**
   * This determines, based on the state and/or outcome of the request, whether a component should
   * be rendered or not. When a state is false the `noopComponent` will be rendered, when it is true
   * the `yieldComponent` is rendered.
   * @type {Object}
   */
  state: computed('isLoading', 'lastSuccessValue', function () {
    const noopComponent = this.get('noopComponent');
    const showLastSuccessful = this.get('showLastSuccessful') && this.get('hasSuccessData');
    const showError = this.get('isError') && !showLastSuccessful;
    const showLoading = this.get('isLoading') && !showLastSuccessful;
    const showSuccess = this.get('isSuccess') || showLastSuccessful;

    return {
      error: {
        isActive: this.get('isError'),
        component: showError ? this.get('errorComponent') : noopComponent,
        data: this.get('taskInstance.error'),
      },
      success: {
        isActive: this.get('isSuccess'),
        component: showSuccess ? this.get('successComponent') : noopComponent,
        data: this.get('lastSuccessValue'),
      },
      loading: {
        isActive: this.get('isLoading'),
        component: showLoading ? this.get('loadingComponent') : noopComponent,
        data: null,
      },
    };
  }),

  /**
   * Set defaults and request data once we have attributes
   */
  didReceiveAttrs() {
    this._super(...arguments);

    /**
     * One or more actions that each return a promise.
     * @type {Function|Object|Array}
     */
    this.dataActions = this.getWithDefault('dataActions', noop);

    /**
     * Reject request immediately if any of the promises are rejected.
     * @type {Boolean}
     */
    this.failFast = this.getWithDefault('failFast', true);

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

    /**
     * Whether or not we should set an event listener so outside components can trigger data fetches
     * @type {Boolean}
     */
    this.listenForEvents = this.getWithDefault('listenForEvents', false);

    // If we want to allow for outside sources to take action, set up event listeners
    if (this.listenForEvents) {
      this._updateData = this._updateData.bind(this);
      this._flushData = this._flushData.bind(this);
      this.get('triEvents').on('update', this._updateData);
      this.get('triEvents').on('flush', this._flushData);
    }

    // Fetch data once we have the `dataActions`
    this.send('fetchData', this.get('dataActions'));
  },

  /**
   * Remove the event listeners when the component is destroyed to prevent memory leaks
   */
  willDestroy() {
    this._super(...arguments);

    if (this.get('listenForEvents')) {
      this.get('triEvents').off('update', this._updateData);
      this.get('triEvents').off('flush', this._flushData);
    }
  },

  /**
   * Update the `dataActions` and call the action to fetch data
   */
  _updateData(actions) {
    if (actions) {
      this.set('dataActions', actions);
      this.send('fetchData', actions);
    } else {
      this.send('reloadData');
    }
  },

  /**
   * Call the action to flush data
   */
  _flushData() {
    this.send('flushData');
  },

  /**
   * Task that makes the request(s) provided by the `dataActions` attribute. We wrap the
   * request in a concurrency task so we have more control over the state of the request(s).
   * @return {Promise}
   */
  _fetchDataTask: task(function* (actions) {
    try {
      // Handle the request(s) differently depending on how the actions are provided
      switch (typeOf(actions)) {
        case 'object': {
          const promises = {};

          // Construct an object containing promises for each action
          for (let i = 0, keys = Object.keys(actions); i < keys.length; i += 1) {
            promises[keys[i]] = actions[keys[i]]();
          }

          if (this.get('resolveAll')) {
            return yield RSVP.hashSettled(promises);
          }

          return yield RSVP.hash(promises);
        }

        case 'array': {
          const promises = actions.map((action) => {
            return action();
          });

          if (this.get('resolveAll')) {
            return yield RSVP.allSettled(promises);
          }

          return yield RSVP.all(promises);
        }

        default:
          return yield actions();
      }
    } catch (e) {
      throw e;
    }
  }).cancelOn('willDestroyElement').restartable(),

  actions: {
    /**
     * Taskify the actions provided via `dataActions` and fetch the data
     * @return {Promise}
     */
    fetchData(actions) {
      let promiseActions = actions;

      if (isBlank(promiseActions)) {
        Logger.warn([
          'No actions were provided to the "dataActions" attribute of the tri-state component.',
          'Provide one or more actions that each return a promise.',
        ].join(' '));

        return Promise.resolve(undefined);
      }

      // Keep a reference to the most recent request so we can reload it
      this.set('dataActions', promiseActions);

      // Create new object to avoid bug with mutating the hash helper object
      if (typeOf(promiseActions) === 'object') {
        promiseActions = merge({}, promiseActions);
      }

      // Fetch data and set to `taskInstance`
      this.set('taskInstance', this.get('_fetchDataTask').perform(promiseActions));

      return this.get('_fetchDataTask');
    },

    /**
     * Reload the data provided by the `dataActions` property
     */
    reloadData() {
      this.send('fetchData', this.get('dataActions'));
    },

    /**
     * Flush the last successful data
     */
    flushData() {
      this.set('_fetchDataTask.lastSuccessful.value', null);
    },
  },
});
