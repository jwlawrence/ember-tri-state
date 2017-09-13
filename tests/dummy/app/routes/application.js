import Route from '@ember/routing/route';
import RSVP from 'rsvp';
import { run } from '@ember/runloop';
import { task, timeout } from 'ember-concurrency';

export default Route.extend({
  model() {
    return {
      errorRequest: this.getError(),
      eventsRequest: this.getEvents(),
      postRequest: this.get('getPost').perform(),
      userRequest: this.getUser()
    }
  },

  getPost: task(function * () {
    yield timeout(1000);
    return {
      title: 'Hello World',
    }
  }).cancelOn('deactivate').restartable(),

  getUser(name = 'Bernard') {
    return new RSVP.Promise((resolve, reject) => {
      run.later(this, () => {
      	resolve({
          name,
          time: Date.now(),
        });
    	}, 1000);
    });
  },

  getEvents() {
    return new RSVP.Promise((resolve, reject) => {
      run.later(this, () => {
      	reject('Events not found');
    	}, 2000);
    });
  },

  getError() {
    return new RSVP.Promise((resolve, reject) => {
      run.later(this, () => {
      	reject('Uh oh, this promise was rejected');
    	}, 2500);
    });
  },

  actions: {
    refreshModel() {
      this.refresh();
    }
  },
});
