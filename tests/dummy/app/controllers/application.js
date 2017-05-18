import Ember from 'ember';

const { Controller } = Ember;

export default Controller.extend({
  showLastSuccessful: true,

  onFulfilled(data) {
    console.log('fulfilled: ', data);
  },

  onRejected(reason) {
    console.log('rejected: ', reason);
  },
  
  onSettled() {
    console.log('settled');
  },
  
  actions: {
    refreshModel(flush = false) {
      this.set('showLastSuccessful', flush);
      return true;
    },
  }
});
