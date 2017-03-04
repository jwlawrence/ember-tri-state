import Ember from 'ember';

const { Component, inject } = Ember;

export default Ember.Component.extend({
  triEvents: inject.service(),

  actions: {
    update(actions) {
      this.get('triEvents').trigger('update', actions);
    }
  }
});
