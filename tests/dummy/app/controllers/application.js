import Ember from 'ember';

const { Controller } = Ember;

export default Controller.extend({
  showLastSuccessful: true,

  actions: {
    resetShowLastSuccessful() {
      this.set('showLastSuccessful', true);
    },

    flushAndRefreshModel() {
      this.set('showLastSuccessful', false);
      return true;
    },
  },
});
