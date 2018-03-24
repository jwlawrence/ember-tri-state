import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | tri yield', function(hooks) {
  setupRenderingTest(hooks);

  test('it yields its data attribute', async function(assert) {
    await render(hbs`{{tri-yield data="foo"}}`);

    assert.equal(find('*').textContent.trim(), '', 'it does not output anything');

    await render(hbs`
      {{#tri-yield data="foo" as |data|}}
        {{data}}
      {{/tri-yield}}
    `);

    assert.equal(find('*').textContent.trim(), 'foo', 'it yields `foo`');
  });
});
