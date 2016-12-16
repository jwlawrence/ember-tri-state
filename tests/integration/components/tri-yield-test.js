import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('tri-yield', 'Integration | Component | tri yield', {
  integration: true
});

test('it renders', function(assert) {
  this.render(hbs`{{tri-yield}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#tri-yield}}
      template block text
    {{/tri-yield}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
