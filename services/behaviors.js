'use strict';
var _ = require('lodash'),
  rivets = require('rivets'),
  references = require('./references'),
  // hash of all behaviors
  behaviorsHash = {},
  // has of current bindings
  bindingsHash = {};

/**
 * add a behavior to the hash. called by users who want to create custom behaviors
 * @param {string}   name
 * @param {Function} fn   usually from a browserify require() call
 */
function addBehavior(name, fn) {
  // note: this WILL overwrite behaviors already in the hash,
  // allowing people to use custom versions of our core behaviors
  behaviorsHash[name] = fn;
}

/**
 * run behaviors for a field, in order
 * @param  {string} name     field name
 * @param  {{data: {}, schema: {}}} partials
 * @return {NodeElement}
 */
function runBehaviors(name, partials) {
  var schema = partials.schema,
    data = partials.data || '',
    path = partials.path || name,
    behaviors = getExpandedBehaviors(schema[references.fieldProperty]),
    done;

  console.log('\nrunning behaviors for "' + name + '"');
  done = _.reduce(behaviors, function (result, behavior) {
    var behaviorName = behavior[references.behaviorKey];

    // each behavior gets called and returns a modified element
    if (behaviorsHash[behaviorName]) {
      return behaviorsHash[behaviorName](result, behavior.args);
    } else {
      console.log('Behavior "' + behaviorName + '" not found. Make sure you add it!');
      return result;
    }
  }, { el: document.createDocumentFragment(), bindings: { data: data, name: name, path: path }, rivets: rivets });

  // use the rivets instance that was passed through the behaviors, since it may have formatters/etc added to it
  bindingsHash[name] = done.rivets.bind(done.el, done.bindings); // compile and bind templates, persist them to bindingsHash
  return done.el;
}

/**
 * expand a single behavior
 * @param  {*} behavior 
 * @return {{}}
 */
function expandBehavior(behavior) {
  var key;

  if (_.isString(behavior) && behavior.length) {
    // _has: text
    return { fn: behavior, args: {} };
  } else if (_.isPlainObject(behavior) && _.isString(behavior[references.behaviorKey])) {
    /* _has:
     *   fn: text
     *   required: true
     */
    key = behavior[references.behaviorKey]; // hold onto this reference
    return { fn: key, args: _.omit(behavior, key) };
  } else {
    throw new Error('Cannot parse behavior: ' + behavior);
  }
}

/**
 * get an array of expanded behaviors
 * @param  {*} behaviors
 * @return {[]}           array of {fn: string, args: {}}
 */
function getExpandedBehaviors(behaviors) {
  if (_.isString(behaviors) || _.isPlainObject(behaviors)) {
    return [expandBehavior(behaviors)]; // wrap it in an array
  } else if (_.isArray(behaviors) && behaviors.length) {
    /* _has:
     *   - text
     *   -
     *     fn: other-behavior
     *     required: true
     */
    return behaviors.map(expandBehavior);
  } else {
    throw new Error('Cannot parse behaviors: ' + behaviors);
  }
}

function getBinding(name) {
  return bindingsHash[name];
}

exports.add = addBehavior;
exports.run = runBehaviors;
exports.getExpandedBehaviors = getExpandedBehaviors;
exports.getBinding = getBinding;