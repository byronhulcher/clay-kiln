import Vue from 'vue';
import _ from 'lodash';
import { editAttr, placeholderAttr, placeholderProp, fieldProp, componentListProp, componentProp } from '../utils/references';
import { get } from '../core-data/groups';
import { isEmpty } from '../utils/comparators';
import placeholderTpl from './placeholder.vue';

const Placeholder = Vue.component('placeholder', placeholderTpl);

function booleanOr(firstBoolean, secondBoolean) {
  return firstBoolean || secondBoolean;
}

function booleanAnd(firstBoolean, secondBoolean) {
  return firstBoolean && secondBoolean;
}

function booleanXor(firstBoolean, secondBoolean) {
  return (firstBoolean && !secondBoolean) || (!firstBoolean && secondBoolean);
}

/**
 * if all comparators are strictly equal, return that value, otherwise return null
 * @param {array} comparators
 */
function getMatchingComparator(comparators) {
  return comparators.reduce(function(a, b){ return (a === b) ? a : null; }); 
}

/**
 * compare multiple fields to see if they're empty
 * comparators are case insensitive, so 'AND', 'and', 'OR', 'or', etc work
 * this currently only supports using the same boolean comparator
 * @param {array} tokens must contain an odd number of items: alternating field names then 
 * @param {object} fields
 * @returns {boolean}
 */
export function compareMultipleFields(tokens, fields) {
  let fieldNames = tokens.filter( (value, index) => index % 2 == 0 ), // even tokens will be field names
    comparators = tokens.filter( (value, index) => index % 2 == 1  ).map(Function.prototype.call, String.prototype.toLowerCase), // odd tokens will be comparators
    areFieldsEmpty = fieldNames.map((fieldName) => fields[fieldName]).map(isEmpty),
    supportedComparatorFunctions = {
      'and': booleanAnd,
      'or': booleanOr,
      'xor': booleanXor
    },
    comparator,
    comparatorFunction;

  if (!(fieldNames.length === comparators.length+1)){
    throw new Error(`'ifEmpty' statement does not have enough comparators for the number of fields you included. You provided: ${tokens}`);
  }

  comparator = getMatchingComparator(comparators);
  if (!comparator){
    throw new Error(`'ifEmpty' statement only supports using identical comparators. You provided: ${comparators}`);
  }

  if (comparator === "xor" && comparators.length > 1) {
    throw new Error(`'ifEmpty' statement only supports a single XOR. Logically, XOR only works on two values. You provided: ${comparators}`);
  }

  comparatorFunction = supportedComparatorFunctions[comparator];
  if (typeof(comparatorFunction) === 'undefined'){
    throw new Error(`'ifEmpty' statement only supports the comparators ["xor", "or", "and"]. You provided: ${comparators}`);
  }

  return areFieldsEmpty.reduce(comparatorFunction); 
}

/**
 * test to see if a group is empty
 * @param  {object}  fields
 * @param  {object}  placeholder
 * @param  {string}  path for error message
 * @return {Boolean}
 */
export function isGroupEmpty(fields, placeholder, path) {
  const ifEmpty = placeholder.ifEmpty;

  let tokens;

  if (!ifEmpty || !_.isString(ifEmpty)) {
    throw new Error(`Placeholder for group '${path}' needs 'ifEmpty' statement!`);
  }

  // tokenize the `ifEmpty` statement and check the emptiness of the field(s)
  tokens = ifEmpty.split(' ').filter( (token) => token.length > 0);

  if (tokens.length === 1) {
    // check a single field to see if it's empty
    return isEmpty(fields[_.head(tokens)]);
  } else {
    // check multiple fields
    // note: for now (because order of operations is non-trivial and I'm lazy)
    // this is limited to checking fields using only a single comparator
    // ie `foo AND bar AND baz` or `foo OR bar OR baz`
    return compareMultipleFields(tokens, fields);
  }
}

/**
 * test to see if a component property is empty
 * @param  {array|string}  field (string means it's an alias to a page area)
 * @return {Boolean}
 */
function isComponentListEmpty(field) {
  return _.isEmpty(field);
  // todo: I'm not sure if this will work for page areas in layouts,
  // so please test against that before releasing
}

/**
 * test to see if a component property is empty
 * @param  {object}  field
 * @return {Boolean}
 */
function isComponentPropEmpty(field) {
  return _.isEmpty(field);
}

/**
 * determine if a placeholder is needed
 * @param  {string}  uri
 * @param  {string}  path to field/group
 * @return {Boolean}
 */
export function hasPlaceholder(uri, path) {
  const group = get(uri, path),
    fields = group.fields,
    schema = group.schema,
    placeholder = schema && schema[placeholderProp],
    isPermanentPlaceholder = placeholder && !!placeholder.permanent,
    isField = schema && !!schema[fieldProp],
    isGroup = schema && !!schema.fields,
    isComponentList = schema && !!schema[componentListProp],
    isComponentProp = schema && !!schema[componentProp];

  // if there isn't a placeholder at all, return negative quickly
  // since we're ususally checking a bunch of fields/groups
  if (!placeholder) {
    return false;
  }

  // if it has a placeholder...
  // if it's a permanent placeholder, it always displays
  // if it's a field, make sure it's empty
  // if it's a group, make sure it points to an empty field
  // if it's a component list, make sure it's empty
  // if it's a component prop, make sure it's empty
  if (isPermanentPlaceholder) {
    return true;
  } else if (isField) {
    return isEmpty(fields[path]);
  } else if (isGroup) {
    return isGroupEmpty(fields, placeholder, path);
  } else if (isComponentList) {
    return isComponentListEmpty(fields[path], uri, path);
  } else if (isComponentProp) {
    return isComponentPropEmpty(fields[path]);
  } else {
    throw new Error(`Could not determine if I should add a placeholder for ${path} (in ${uri})`);
  }
}

/**
 * create a new vue placeholder and add it
 * @param {string} uri
 * @param {string} path
 * @param {Element} el
 */
export function addPlaceholder(uri, path, el) {
  const parentHeight = getComputedStyle(el).height,
    placeholder = new Placeholder({ uri, path, parentHeight }).$mount();

  el.appendChild(placeholder.$el);
}

/**
 * add placeholders if they're needed
 * @param  {string} uri
 * @param  {element} el with data-editable / data-placeholder
 */
export default function handler(uri, el) {
  const path = el.getAttribute(editAttr) || el.getAttribute(placeholderAttr);

  if (hasPlaceholder(uri, path)) {
    addPlaceholder(uri, path, el);
  }
}
