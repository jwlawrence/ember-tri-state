import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('tri-yield', 'Integration | Component | tri yield', {
  integration: true,
});

test('it yields its data attribute', function(assert) {
  this.render(hbs`{{tri-yield data="foo"}}`);

  assert.equal(this.$().text().trim(), '', 'it does not output anything');

  this.render(hbs`
    {{#tri-yield data="foo" as |data|}}
      {{data}}
    {{/tri-yield}}
  `);

  assert.equal(this.$().text().trim(), 'foo', 'it yields `foo`');
});
