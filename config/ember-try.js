'use strict';

const getChannelURL = require('ember-source-channel-url');

module.exports = function() {
  return Promise.all([
    getChannelURL('release'),
    getChannelURL('beta'),
    getChannelURL('canary'),
  ]).then((urls) => {
    return {
      useYarn: true,
      scenarios: [
        {
          name: 'ember-lts-2.18',
          npm: {
            devDependencies: {
              'ember-source': '~2.18.0'
            }
          }
        },
        {
          name: 'ember-lts-3.1',
          npm: {
            devDependencies: {
              'ember-source': '~3.1.0'
            }
          }
        },
            {
          name: 'ember-lts-3.4',
          npm: {
            devDependencies: {
              'ember-source': '~3.4.0'
            }
          }
        },
        {
          name: 'ember-lts-3.6',
          npm: {
            devDependencies: {
              'ember-source': '~3.6.0'
            }
          }
        },
            {
          name: 'ember-lts-3.9',
          npm: {
            devDependencies: {
              'ember-source': '~3.9.0'
            }
          }
        },
        {
          name: 'ember-release',
          npm: {
            devDependencies: {
              'ember-source': urls[0]
            }
          }
        },
        {
          name: 'ember-beta',
          npm: {
            devDependencies: {
              'ember-source': urls[1]
            }
          }
        },
        {
          name: 'ember-canary',
          npm: {
            devDependencies: {
              'ember-source': urls[2]
            }
          }
        },
        {
          name: 'ember-default',
          npm: {
            devDependencies: {}
          }
        }
      ]
    };
  });
};
