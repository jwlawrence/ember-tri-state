import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | tri noop', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders nothing', async function(assert) {
    await render(hbs`{{tri-noop}}`);

    assert.equal(find('*').textContent.trim(), '');

    // Template block usage:
    await render(hbs`
      {{#tri-noop}}
        template block text
      {{/tri-noop}}
    `);

    assert.equal(find('*').textContent.trim(), '');
  });
});
