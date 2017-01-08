# ember-tri-state

## What is this?

ember-tri-state is an Ember addon that primarily provides a `tri-state` component, the purpose of which is to manage what is rendered to the UI depending on the state of a provided promise (or promises).

*Note: This is work in progress and currently only works on Ember 2.10 or higher.*

*Caveat: Since we bypass the `model` hook in the route fastboot will render the page immediately without any data. If you are relying on fastboot for SEO, you will probably want to continue returning critical data in your model hook and using `tri-state` only for non-SEO imperative content (like loading tweets or comments for example)*

## Why would I use it?

By default, if you return a promise as part of a route's `model` hook Ember blocks rendering until that promise resolves. Of course you can leverage loading substates, but they don't offer much flexibility in how you present loading feedback to the user. This is fine for basic use cases, but it becomes frustrating when the request is slow or the returned data isn't vital to the initial page load.

It becomes even more of an issue when you want to make multiple requests in a given route. If you return an `RSVP.hash` in your model hook, your users will be stuck waiting until all of the promises resolve (or one is rejected).

Most likely, you want to show the user a page scaffolding that is absent of data and show the loading state of each request individually. This way different sections of your page can show content for the 'loading', 'error', or 'success' states of each request. The goal of ember-tri-state is to make this a trivial task.

## How do I use it?

### Install the addon

`npm i --save-dev ember-tri-state`

### Create your fetch action(s)

Rather than returning promises in your model hook, you will directly provide the `tri-state` component an action that returns a promise. This is how we avoid blocking the UI while loading our data.

You have a few options for where you define your actions.

1. In your route file.
  * Since this is where you would normally have all data related actions, you can keep them here and access them in your template by either using [ember-route-action-helper](https://github.com/DockYard/ember-route-action-helper) or by setting them to the controller via `setupController`.
2. In a higher level component.
  * You can pass the action from a higher level component via a closure action.
3. In your controller.
  * There is debate about whether or not controllers should be used for anything other than decorators, so this isn't a great option.

For option 1, your route file might look similar to the following example. Note you don't have to return anything from the `model` hook since we'll access the fetch action directly in the `tri-state` component.

```
// route - index.js
import Ember from 'ember';

export default Ember.Route.extend({
  actions: {
    fetchPosts() {
      return this.store.findAll('post');
    },
  },
});
```

### Include the `tri-state` component in your templates

The basic idea is that the `tri-state` component accepts an action (or actions) that returns a promise and figures out what to render based off of the state of the promise and what you have defined in your template. The component must be used in block form. Here's a simple example:

```
{{#tri-state dataActions=(route-action 'fetchPosts') as |state data| }}
  // Rendered while the request is in progress
  {{#state.loading}}
    <p>Loading...</p>
  {{/state.loading}}

  // Rendered if the request is rejected
  {{#state.error}}
    <p>An error occurred: {{data.message}}</p>
  {{/state.error}}

  // Rendered if the request resolves successfully
  {{#state.success}}
    {{#each data as |post|}}
      {{post.title}}
      {{post.excerpt}}
    {{/each}}
  {{/state.success}}
{{/tri-state}}
```

`tri-state` accepts two attributes: `dataActions` and `failFast`

* dataActions {Function|Array|Object} - One or more actions that each return a promise. Required.
* failFast    {Boolean}               - Reject request immediately if any of the promises are rejected. Defaults to true.

Multiple `dataActions` can be passed with the `hash` helper or the included `to-array` helper:

```
// Single action
{{#tri-state dataActions=(action 'fetchPost') as |state data| }}
...

// Hash of actions
{{#tri-state dataActions=(hash
  post=(action 'fetchPost')
  auther=(action 'fetchAuthor')
) as |state data| }}
...

// Array of actions
{{#tri-state dataActions=(to-array
  (action 'fetchPost')
  (action 'fetchAuthor')
) as |state data| }}
...
```

### Using the yielded `state` and `data` objects

The `state` object contains components for each of the three possible states: 'loading', 'error', 'success'. If the state is active, the component yields whatever is inside of it's block, if it is inactive it yields nothing. In this way we can define what we want to display for each of our states in our template and not have to worry about adding conditional statements everywhere.

The `data` object contains the result of the promise(s) being executed. Behind the scenes we use the amazing [ember-concurrency](http://ember-concurrency.com/) addon to determine the state of the request and give us the ability to cancel requests in case the user leaves the route before the request has finished. The contents of the data object will differ depending on the request and it's state.

## How do I contribute to this addon?

### Installation

* `git clone https://github.com/jwlawrence/ember-tri-state` this repository
* `cd ember-tri-state`
* `npm install`
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
