import Ember from 'ember';

export default Ember.Route.extend({
  ajax: Ember.inject.service(),

  actions: {
    getUser(name = 'Bernard') {
      return Promise.resolve({
        name: name,
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
    }
  }
});
