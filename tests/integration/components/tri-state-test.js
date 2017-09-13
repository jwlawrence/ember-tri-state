import RSVP from 'rsvp';
import { run } from '@ember/runloop';
import { typeOf } from '@ember/utils';
import Ember from 'ember';
import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

const {
  Logger,
  Test
} = Ember;

let originalLoggerError;
let originalTestAdapterException;
const unresolvedPromise = new RSVP.Promise(() => {});
const template = hbs`
  {{#tri-state
    promises=promises
    forceResolveAll=forceResolveAll
    showLastSuccessful=showLastSuccessful
    onFulfilledData=onFulfilledData
    yieldComponent=yieldComponent
    noopComponent=noopComponent
    errorComponent=errorComponent
    successComponent=successComponent
    loadingComponent=loadingComponent
    as |tri|
  }}
    {{#tri.error as |error|}}
      <h2 class="title-error">{{error}}</h2>
    {{/tri.error}}

    {{#tri.success as |data|}}
      <h2 class="title-success">Success</h2>
    {{/tri.success}}

    {{#tri.loading}}
      <h2 class="title-loading">Loading</h2>
    {{/tri.loading}}
  {{/tri-state}}
`;

moduleForComponent('tri-state', 'Integration | Component | tri state', {
  integration: true,
  beforeEach() {
    /**
     * Workaround to allow testing with rejected promises
     * @see {@link https://github.com/emberjs/ember.js/issues/11469#issuecomment-228132452}
     */
    originalLoggerError = Logger.error;
    originalTestAdapterException = Test.adapter.exception;
    Logger.error = function() {};
    Test.adapter.exception = function() {};

    this.setProperties({
      promises: RSVP.Promise.resolve('Test McTesterson'),
      forceResolveAll: false,
      showLastSuccessful: false,
      onFulfilledData: () => {},
    });
  },
  afterEach() {
    Logger.error = originalLoggerError;
    Test.adapter.exception = originalTestAdapterException;
  }
});

test('it renders the success block when a request is fulfilled', function (assert) {
  this.render(template);

  return wait().then(() => {
    assert.equal(this.$().text().trim(), 'Success', 'Success component rendered');
  });
});

test('it renders the loading block when a request is pending', function (assert) {
  this.set('promises', unresolvedPromise);
  this.render(template);
  assert.equal(this.$('.title-loading').text().trim(), 'Loading', 'Loading component rendered');
});

test('it renders the error block when a request is rejected', function (assert) {
  this.set('promises', RSVP.Promise.reject('Bummer'));
  this.render(template);

  return wait().then(() => {
    assert.equal(this.$().text().trim(), 'Bummer', 'Error component rendered');
  });
});

test('the success component can be overridden', function (assert) {
  this.set('successComponent', 'component-override');
  this.render(template);

  return wait().then(() => {
    assert.equal(this.$().text().trim(), 'Component Override', 'Success component overridden');
  });
});

test('the loading component can be overridden', function (assert) {
  this.setProperties({
    promises: unresolvedPromise,
    loadingComponent: 'component-override',
  });
  this.render(template);

  assert.equal(this.$().text().trim(), 'Component Override', 'Loading component overridden');
});

test('the error component can be overridden', function (assert) {
  this.setProperties({
    promises: RSVP.Promise.reject('error'),
    errorComponent: 'component-override',
  });
  this.render(template);

  return wait().then(() => {
    assert.equal(this.$().text().trim(), 'Component Override', 'error component overridden');
  });
});

test('the yield and noop components can be overridden', function (assert) {
  this.setProperties({
    promises: unresolvedPromise,
    yieldComponent: 'component-override',
  });
  this.render(template);

  assert.equal(this.$().text().trim(), 'Component Override', 'yield component overridden');
  
  this.setProperties({
    noopComponent: 'component-override',
    yieldComponent: 'tri-noop',
  });
  this.render(template);

  assert.equal(this.$().text().trim(), 'Component Override\nComponent Override', 'noop component overridden');
});

test('it resolves despite containing rejected promises when forceResolveAll is true', function (assert) {
  this.setProperties({
    promises: {
      name: RSVP.Promise.resolve('Test McTesterson'),
      title: RSVP.Promise.reject('error'),
    },
    forceResolveAll: true,
  });
  this.render(template);

  return wait().then(() => {
    assert.equal(this.$('.title-success').text().trim(), 'Success', 'Resolved despite error');
  });
});

test('it renders the success block when fetching new data if showLastSuccessful is true', function (assert) {
  this.set('showLastSuccessful', true);
  this.render(hbs`
    {{#tri-state
      promises=promises
      showLastSuccessful=showLastSuccessful
      as |tri|
    }}
      {{#tri.success as |data|}}
        <h2 class="title-success">{{data}}</h2>
        <p class="loading">{{if tri.isLoading 'Updating...'}}</p>
      {{/tri.success}}
    {{/tri-state}}
  `);
  this.set('promises', unresolvedPromise);
  
  assert.equal(this.$('.loading').text().trim(), 'Updating...', 'Reload in progress');
  assert.equal(this.$('.title-success').text().trim(), 'Test McTesterson', 'Last successful data rendered');
});

test('it calls the onFulfilledData callback once successfully resolved', function (assert) {
  let fulfilled = false;

  this.setProperties({
    promises: unresolvedPromise,
    onFulfilledData: () => {
      fulfilled = true;
    },
  });
  this.render(template);

  // promise not yet resolved, callback hasn't been called
  assert.notOk(fulfilled, 'onFullfilledData callback called');

  this.set('promises', RSVP.Promise.resolve('success'));
  this.render(template);

  return wait().then(() => {
    assert.ok(fulfilled, 'onFullfilledData callback called');
  });
});