import RSVP from 'rsvp';
import { run } from '@ember/runloop';
import { typeOf } from '@ember/utils';
import Ember from 'ember';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

const {
  Logger,
  Test
} = Ember;

const promise = new RSVP.Promise(() => {});
const rejectedPromise = RSVP.Promise.reject('kaboom');
rejectedPromise.catch(() => {});
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

module('Integration | Component | tri state', function(hooks) {
  setupRenderingTest(hooks);

  hooks.beforeEach(function() {
    this.setProperties({
      promises: RSVP.Promise.resolve('Test McTesterson'),
      forceResolveAll: false,
      showLastSuccessful: false,
      onFulfilledData: () => {},
    });
  });

  test('it renders the success block when a request is fulfilled', async function(assert) {
    await render(template);
    assert.equal(find('*').textContent.trim(), 'Success', 'Success component rendered');
  });

  test('it renders the loading block when a request is pending', async function(assert) {
    this.set('promises', promise);
    await render(template);
    assert.equal(find('.title-loading').textContent.trim(), 'Loading', 'Loading component rendered');
  });

  test('it renders the error block when a request is rejected', async function(assert) {
    this.set('promises', rejectedPromise);
    await render(template);
    assert.equal(find('*').textContent.trim(), 'kaboom', 'Error component rendered');
  });

  test('the success component can be overridden', async function(assert) {
    this.set('successComponent', 'component-override');
    await render(template);
    assert.equal(find('*').textContent.trim(), 'Component Override', 'Success component overridden');
  });

  test('the loading component can be overridden', async function(assert) {
    this.setProperties({
      promises: promise,
      loadingComponent: 'component-override',
    });
    await render(template);
    assert.equal(find('*').textContent.trim(), 'Component Override', 'Loading component overridden');
  });

  test('the error component can be overridden', async function(assert) {
    this.setProperties({
      promises: rejectedPromise,
      errorComponent: 'component-override',
    });
    await render(template);
    assert.equal(find('*').textContent.trim(), 'Component Override', 'error component overridden');
  });

  test('the yield and noop components can be overridden', async function(assert) {
    this.setProperties({
      promises: promise,
      yieldComponent: 'component-override',
    });
    await render(template);
    assert.equal(find('*').textContent.trim(), 'Component Override', 'yield component overridden');

    this.setProperties({
      noopComponent: 'component-override',
      yieldComponent: 'tri-noop',
    });
    await render(template);
    assert.equal(find('*').textContent.trim(), 'Component Override\nComponent Override', 'noop component overridden');
  });

  test('it resolves despite containing rejected promises when forceResolveAll is true', async function(assert) {
    this.setProperties({
      promises: {
        name: RSVP.Promise.resolve('Test McTesterson'),
        title: rejectedPromise,
      },
      forceResolveAll: true,
    });
    await render(template);
    assert.equal(find('.title-success').textContent.trim(), 'Success', 'Resolved despite error');
  });

  test('it renders the success block when fetching new data if showLastSuccessful is true', async function(assert) {
    this.set('showLastSuccessful', true);
    await render(hbs`
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
    this.set('promises', promise);
    assert.equal(find('.loading').textContent.trim(), 'Updating...', 'Reload in progress');
    assert.equal(find('.title-success').textContent.trim(), 'Test McTesterson', 'Last successful data rendered');
  });

  test('it calls the onFulfilledData callback once successfully resolved', async function(assert) {
    let fulfilled = false;
    this.setProperties({
      promises: promise,
      onFulfilledData: () => {
        fulfilled = true;
      },
    });
    await render(template);
    // promise not yet resolved, callback hasn't been called
    assert.notOk(fulfilled, 'onFullfilledData callback called');

    this.set('promises', RSVP.Promise.resolve('success'));
    await render(template);
    assert.ok(fulfilled, 'onFullfilledData callback called');
  });
});