import Ember from 'ember';

export default Ember.Route.extend({
  ajax: Ember.inject.service(),
  triEvents: Ember.inject.service(),

  model() {
    this.get('triEvents').trigger('update');

    return {
      getUser: this.getUser,
      getEvents: this.getEvents,
    }
  },

  getUser(name = 'Bernard') {
    return Promise.resolve({
      name,
      time: Date.now(),
    });
  },

  getEvents() {
    return Promise.resolve([
      {
        name: 'foo',
        location: 'SF',
      },
      {
        name: 'bar',
        location: 'SV',
      }
    ]);
  },

  actions: {
    refresh() {
      this.refresh();
    }
  },
});
