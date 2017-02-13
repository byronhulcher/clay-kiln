import _ from 'lodash';
import Vue from 'vue';
import store from './lib/core-data/store';
import { decorateAll } from './lib/decorators';
import toolbar from './lib/toolbar/edit-toolbar.vue';

// Require all scss/css files needed
require.context('./styleguide', true, /^.*\.(scss|css)$/);

// kick off loading when DOM is ready
// note: preloaded data, external behaviors, decorators, and validation rules should already be added
// when this event fires
document.addEventListener('DOMContentLoaded', function () {
  new Vue({
    strict: true,
    el: '#kiln-app',
    render(h) {
      return h('edit-toolbar');
    },
    store,
    components: {
      'edit-toolbar': toolbar
    }
  });

  store.dispatch('preload').then(() => decorateAll());

  // when clicks bubble up to the document, close the current form or pane / unselect components
  document.body.addEventListener('click', (e) => {
    e.stopPropagation();

    if (_.get(store, 'state.ui.currentSelection')) {
      store.dispatch('unselect');
    }
  });
});
