import Ember from 'ember';
import layout from 'ember-tri-state/templates/components/tri-state';
import { task } from 'ember-concurrency';

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
   * Name of the component responsible for rendering each state when inactive
   * @type {String}
   */
  noopComponent: 'tri-noop',

  /**
   * Name of the component responsible for rendering each state when active
   * @type {String}
   */
  yieldComponent: 'tri-yield',

  /**
   * This determines, based on the state and/or outcome of the request, whether a component should
   * be rendered or not. When a state is false the `noopComponent` will be rendered, when it is true
   * the `yieldComponent` is rendered.
   * @type {Object}
   */
  components: computed('taskInstance.isRunning', function () {
    const taskInstance = this.get('taskInstance');
    const noopComponent = this.get('noopComponent');
    const yieldComponent = this.get('yieldComponent');

    if (!taskInstance) {
      return {
        error: noopComponent,
        success: noopComponent,
        loading: noopComponent,
      };
    }

    return {
      error: taskInstance.get('error') ? yieldComponent : noopComponent,
      success: taskInstance.get('value') ? yieldComponent : noopComponent,
      loading: taskInstance.get('isRunning') ? yieldComponent : noopComponent,
    };
  }),

  /**
   * Data returned from the task instance, which we yield back to the template.
   * @type {Object}
   */
  data: computed('taskInstance.isRunning', function () {
    const taskInstance = this.get('taskInstance');

    if (!taskInstance) {
      return null;
    }

    return taskInstance.get('error') || taskInstance.get('value');
  }),

  /**
   * Task that makes the request(s) provided by the `dataActions` attribute. We wrap the
   * request in a concurrency task so we have more control over the state of the request(s).
   * @type {Task}
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
  }).restartable(),

  /**
   * Set defaults and request data once we have attributes
   */
  didReceiveAttrs() {
    this._super(...arguments);
    this.failFast = this.getWithDefault('failFast', true);

    // Fetch data
    this.send('fetchData', this.get('dataActions'));
  },

  actions: {
    /**
     * Taskify the actions provided via `dataActions` and fetch the data
     */
    fetchData(actions) {
      let promiseActions = actions;

      if (isBlank(promiseActions)) {
        Logger.warn([
          'No actions were provided to the "dataActions" attribute of the tri-state component.',
          'Provide one or more actions that each return a promise.',
        ].join(' '));

        return undefined;
      }

      // Create new object to avoid bug with mutating the hash helper object
      if (typeOf(promiseActions) === 'object') {
        promiseActions = merge({}, promiseActions);
      }

      // Fetch data and set to `taskInstance`
      this.set('taskInstance', this.get('_fetchDataTask').perform(promiseActions));

      return this.get('taskInstance');
    },
  },
});
