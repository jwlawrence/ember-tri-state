import Ember from 'ember';
import { task } from 'ember-concurrency';
import layout from '../templates/components/tri-state';

const { Component, computed, isBlank, typeOf, RSVP, merge, Logger } = Ember;

export default Component.extend({
  layout,

  /**
   * Flag used to indicate if we should wait for all promises to resolve or
   * if we should reject immediately as soon as one fails.
   * @type {Boolean}
   */
  resolveAll: computed.not('failFast'),

  /**
   * Name of the noop component to be used when no component name is provided
   * @type {String}
   */
  noopComponent: 'data-noop',

  /**
   * An object containing the names of the components for each state
   * to be yielded back to the template.
   * @type {Object}
   */
  components: computed('taskInstance.isRunning', function () {
    const taskInstance = this.get('taskInstance');
    const noopComponent = this.get('noopComponent');
    let errorComponent = noopComponent;
    let successComponent = noopComponent;
    let loadingComponent = noopComponent;

    if (taskInstance.get('error')) {
      errorComponent = this.get('errorComponent');
    }

    if (taskInstance.get('value')) {
      successComponent = this.get('successComponent');
    }

    if (taskInstance.get('isRunning')) {
      loadingComponent = this.get('loadingComponent');
    }

    return {
      error: errorComponent,
      success: successComponent,
      loading: loadingComponent,
    };
  }),

  /**
   * Data returned from the task instance, which we yield back to the template.
   * @type {Object}
   */
  data: computed('taskInstance.isRunning', function () {
    const taskInstance = this.get('taskInstance');
    return taskInstance.get('error') || taskInstance.get('value');
  }),

  /**
   * Task that makes the request(s) provided by the 'dataActions' attribute. We wrap the
   * request in a concurrency task so we have more control over the state of the request(s).
   * @type {Task}
   */
  _fetchDataTask: task(function * (actions) { // eslint-disable-line
    try {
      // Handle the request(s) differently depending on how the actions are provided
      switch (typeOf(actions)) {
        case 'object': {
          const promises = {};

          // Construct an object containing Promises for each action
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
  }).restartable(),

  /**
   * Perform setup operations once we receive all user provided attributes
   */
  didReceiveAttrs() {
    this._super(...arguments);

    this.failFast = this.getWithDefault('failFast', true);

    // If component names aren't provided, default to the noop component
    this.errorComponent = this.getWithDefault('errorComponent', this.noopComponent);
    this.successComponent = this.getWithDefault('successComponent', this.noopComponent);
    this.loadingComponent = this.getWithDefault('loadingComponent', this.noopComponent);

    // Fetch data
    // TODO: Only refetch data if the dataActions attr changes, not others
    this.send('fetchData', this.get('dataActions'));
  },

  actions: {
    /**
     * Trigger the `_fetchDataTask` task
     */
    fetchData(actions) {
      let promises = actions;

      if (isBlank(promises)) {
        Logger.warn('No actions were provided. Provide an action via the "dataActions" attr.');
        return undefined;
      }

      // Create new object to avoid bug with mutating the hash helper object
      if (typeOf(promises) === 'object') {
        promises = merge({}, promises);
      }

      // Fetch data and set to `taskInstance`
      this.set('taskInstance', this.get('_fetchDataTask').perform(promises));

      return this.get('taskInstance');
    },
  },
});
