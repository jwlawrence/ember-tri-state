import Ember from 'ember';
import { task, timeout } from 'ember-concurrency';

export default Ember.Route.extend({
  model() {
    return {
      userRequest: this.getUser(),
      eventsRequest: this.getEvents(),
      postRequest: this.get('getPost').perform(),
    }
  },

  getPost: task(function * () {
    yield timeout(1000);
    return {
      title: 'Hello World',
    }
  }).cancelOn('deactivate').restartable(),

  getUser(name = 'Bernard') {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({
          name,
          time: Date.now(),
        })
      }, 1000)
    });
  },

  getEvents() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve([
          {
            name: 'foo',
            location: 'SF',
          },
          {
            name: 'bar',
            location: 'SV',
          }
        ]);
      }, 2000)
    });
  },

  actions: {
    flushAndRefreshModel() {
      this.refresh();
    },

    refreshModel() {
      this.refresh();
    }
  },
});
