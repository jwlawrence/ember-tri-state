# ember-tri-state

## What is this?

[![NPM version](https://img.shields.io/npm/v/ember-tri-state.svg?style=flat-square)](https://www.npmjs.com/package/ember-tri-state)
[![Build Status](https://travis-ci.org/jwlawrence/ember-tri-state.svg?branch=master)](https://travis-ci.org/jwlawrence/ember-tri-state)
[![Ember Observer Score](https://emberobserver.com/badges/ember-tri-state.svg)](https://emberobserver.com/addons/ember-tri-state)

ember-tri-state is an Ember addon that aims to make loading data into different sections of your template less of a headache. This is accomplished through a `tri-state` component, which dynamically renders 'loading', 'error', and 'success' components depending on the state of a provided promise (or collection of promises).

Check out the [demo](https://ember-twiddle.com/0334972688d8ccf699b820d783f1b624?openFiles=routes.application.js%2Ctemplates.components.x-error.hbs)

#### *Warning: This addon only works on Ember 2.10 or higher.*

*A note on SEO*: Since we bypass the `model` hook in the route, fastboot will render the page immediately without any data. If you are relying on fastboot for SEO you will probably want to continue resolving data in your model hook and using `tri-state` only for non-SEO imperative content (like loading tweets or comments for example)

## Why would I use it?

Basically, perceived performance gains and improved feedback for your users.

By default, if you return a promise as part of a route's `model` hook Ember blocks rendering until that promise resolves. Of course you can leverage loading substates, but they don't offer much flexibility and are scoped to routes, so you don't have granular control of the page. This is fine for basic use cases, but becomes cumbersome when you have multiple requests being made on a route and you want to render them independently.

If you return an `RSVP.hash` in your model hook, your users will be stuck waiting until all of the promises resolve (or one is rejected) rather than having them resolve individually.

Most likely, you want to show the user a page scaffolding that is initially absent of data and displaying the loading state of each request individually. This way different sections of your page can show content for the 'loading', 'error', or 'success' states of each request as the promises resolve. The goal of ember-tri-state is to make this a trivial task.

## How do I use it?

### Install the addon

`ember install ember-tri-state`

### Create your fetch action(s)

Rather than returning promises or a `RSVP.hash` directly from your model hook, you need to return an object containing promises (or thenables such as an ember-concurrency task). This will allow Ember to render the template immediately since it only sees an object being returned, not a blocking promise. Pass the promise(s) in the model object into `tri-state`'s `promises` attribute and the state will be derived for you.

```
// route - index.js
import Ember from 'ember';

export default Ember.Route.extend({
  model() {
    return {
      postsRequest: this.store.findAll('post'),
    };
  },
});
```

```
{{#tri-state promises=model.postsRequest as |tri|}}
  // your content here
{{/tri-state}}
```

### Using the `tri-state` component in your templates

The `tri-state` component accepts a promise or multiple promises and yields pre-defined components back via a yielded `tri` object. The `tri` object contains components for 'loading', 'error', and 'success' states that dynamically render (or not render) based on the provided promise state. Success and error components will automatically yield the resulting data from the settled request. The `tri-state` component must be used in block form. Here's a simple example:

```
{{#tri-state promises=model.postsRequest as |tri| }}
  // Rendered while the request is in progress
  {{#tri.loading}}
    <p>Loading...</p>
  {{/tri.loading}}

  // Rendered if the request is rejected
  {{#tri.error as |error|}}
    <p>An error occurred: {{error.message}}</p>
  {{/tri.error}}

  // Rendered if the request is successfully fulfilled
  {{#tri.success as |posts|}}
    {{#each posts as |post|}}
      {{post.title}}
      {{post.excerpt}}
    {{/each}}
  {{/tri.success}}
{{/tri-state}}
```

By default the "loading", "error", and "success" components will either yield whatever is placed in their block, or display nothing if they are not active. You can provide the names of components to override these values and use them inline (or block), which can save some space if you have global components you want to reuse across the app.

```
{{#tri-state
  promises=model.postsRequest
  loadingComponent="my-loading-component"
  errorComponent="my-error-component"
  as |tri|
}}
  <h1>This will render regardless of promise state</h1>

  // Renders "my-loading-component" while the request is in progress
  {{tri.loading}}

  // Renders "my-error-component" if the request is rejected
  {{tri.error}}

  // Renders whatever is in the block if the request is successfully fulfilled
  {{#tri.success}}
    <p>Success!</p>
  {{/tri.success}}
{{/tri-state}}
```

Multiple promises can be provided by grouping them in an array or an object. This can be done in a parent component or controller and set to a property or directly in the template via the `hash` helper or a custom `to-array` helper (not-provided):

```
// Single action
{{#tri-state promises=model.postsRequest as |tri| }}
...

// Hash of actions
{{#tri-state promises=(hash
  post=model.postsRequest
  author=model.authorRequest
) as |tri| }}
...

// Array of actions
{{#tri-state dataActions=(to-array
  model.postsRequest
  model.authorRequest
) as |tri| }}
...
```

### Using the yielded `tri` object

The `tri` object contains the component name, and state for each of the three possible states: 'loading', 'error', 'success'. By referencing the property whose name matches one of the three states you can define what you want to render in your template when that state is active (see examples above). Appropriate data is piped directly into whichever component is being yielded through a `data` attribute.

You also have access to `isLoading`, `isError`, and `isSuccess` properties that you can use in conjunction with `showLastSuccessful` to give the user feedback that a request is being made while still displaying the last successfully fetched value. This is helpful when doing something like "load more" where you want to make a new request for more data, but continue displaying the current results.

A word on component rendering. You can explicitly set the component that is rendered for any active state by overriding the `yieldComponent` attribute or you can override specific state components by overriding the `loadingComponent`, `errorComponent`, or `successComponent` attributes. See example above.

## How do I contribute to this addon?

Have an idea on how to make this better? Please open an issue or even better, submit a PR.

### Installation

* `git clone https://github.com/jwlawrence/ember-tri-state` this repository
* `cd ember-tri-state`
* `yarn install`
* `bower install`

### Running

* `ember serve`
* Visit your app at [http://localhost:4200](http://localhost:4200).

### Running Tests

* `npm test` (Runs `ember try:each` to test your addon against multiple Ember versions)
* `ember test`
* `ember test --server`

### Building

* `ember build`

For more information on using ember-cli, visit [https://ember-cli.com/](https://ember-cli.com/).
