import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';
import wait from 'ember-test-helpers/wait';

const getAction = function () {
  return Promise.resolve({ name: 'Josh' });
};

moduleForComponent('tri-state', 'Integration | Component | tri state', {
  integration: true
});

test('it renders', function(assert) {
  this.render(hbs`{{tri-state}}`);
  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#tri-state}}
      template block text
    {{/tri-state}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
