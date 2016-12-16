import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('tri-noop', 'Integration | Component | tri noop', {
  integration: true
});

test('it renders nothing', function(assert) {
  this.render(hbs`{{tri-noop}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#tri-noop}}
      template block text
    {{/tri-noop}}
  `);

  assert.equal(this.$().text().trim(), '');
});
