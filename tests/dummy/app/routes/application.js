import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    return {
      userRequest: this.getUser(),
      eventsRequest: this.getEvents(),
    }
  },

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
    return new Promise((resolve) => {
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
