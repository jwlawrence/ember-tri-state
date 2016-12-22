import Ember from 'ember';
import layout from 'ember-tri-state/templates/components/tri-state';
import { task } from 'ember-concurrency';

const { Component, computed, isBlank, K: noop, Logger, merge, RSVP, typeOf } = Ember;

/**
 * The purpose of this component is to handle the conditional rendering of components based on the
 * state of one or more batched data requests. Depending on the state of the request the
 * component will render one of three yielded components: loading, error, or success. A data object
 * is also yielded to the template containing the results of the request.
 *
 * Properties accepted by this component:
 * --------------------------------------
 * dataActions {string|array|object} - One or more actions that each return a promise.
 * failFast    {Boolean}             - Reject request immediately if any of the promises reject.
 * @module  components/tri-state
 */
export default Component.extend({
  layout,

  /**
   * Flag used to indicate if we should wait for all promises to resolve or
   * if we should reject immediately as soon as one fails.
   * @type {Boolean}
   */
  resolveAll: computed.not('failFast'),

  /**
   * Task instance state aliases
   */
  isRunning: computed.alias('taskInstance.isRunning'),
  isError: computed.bool('taskInstance.error'),
  isSuccess: computed.bool('taskInstance.value'),
  lastSuccessfulValue: computed.alias('_fetchDataTask.lastSuccessful.value'),
  hasSuccessData: computed.bool('lastSuccessfulValue'),

  /**
   * This determines, based on the state and/or outcome of the request, whether a component should
   * be rendered or not. When a state is false the `noopComponent` will be rendered, when it is true
   * the `yieldComponent` is rendered.
   * @type {Object}
   */
  components: computed('isRunning', function () {
    const noopComponent = this.get('noopComponent');
    const yieldComponent = this.get('yieldComponent');

    if (this.get('showLastSuccessful') && this.get('hasSuccessData')) {
      return {
        error: noopComponent,
        success: yieldComponent,
        loading: noopComponent,
      };
    }

    return {
      error: this.get('isError') ? yieldComponent : noopComponent,
      success: this.get('isSuccess') ? yieldComponent : noopComponent,
      loading: this.get('isRunning') ? yieldComponent : noopComponent,
    };
  }),

  /**
   * Data returned from the task instance, which we yield back to the template.
   * @type {Object}
   */
  data: computed('isRunning', function () {
    const taskInstance = this.get('taskInstance');

    if (!taskInstance) {
      return null;
    }

    if (this.get('showLastSuccessful') && this.get('hasSuccessData')) {
      return this.get('lastSuccessfulValue');
    }

    return taskInstance.get('error') || taskInstance.get('value');
  }),

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
     * If this flag is set to true, then always display the most recent successful data regardless
     * of the results of rejected tasks
     * @type {Boolean}
     */
    this.showLastSuccessful = this.getWithDefault('showLastSuccessful', false);

    /**
     * Name of the component responsible for rendering each state when inactive
     * @type {String}
     */
    this.noopComponent = this.getWithDefault('noopComponent', 'tri-noop');

    /**
     * Name of the component responsible for rendering each state when active
     * @type {String}
     */
    this.yieldComponent = this.getWithDefault('yieldComponent', 'tri-yield');

    // Fetch data as soon as possible
    this.send('fetchData', this.get('dataActions'));
  },

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
     * Clear all data from the component
     */
    clearData() {
      // TODO: Need to figure out what to display here. Currently it's the success component, should
      // it be nothing instead?
      // this.send('fetchData', () => Promise.resolve(undefined));
    },
  },
});
