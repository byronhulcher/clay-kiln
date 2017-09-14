import * as lib from './placeholders';
import * as groups from '../core-data/groups';
import { placeholderProp, fieldProp, componentListProp, componentProp } from '../utils/references';

describe('placeholders', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(groups);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('compareMultipleFields', () => {
    const fn = lib.compareMultipleFields;

    it('throws error if unknown comparator', () => {
      expect(() => fn(['foo', 'NAND', 'bar'], { foo: null, bar: null })).to.throw(Error);
    });

    it('throws error if you do not include enough fields', () => {
      expect(() => fn(['foo', 'and', 'bar', 'and'], { foo: null, bar: null })).to.throw(Error);
    });

    it('throws error if you mix comparators', () => {
      expect(() => fn(['foo', 'and', 'bar', 'or', 'baz'], { foo: null, bar: null })).to.throw(Error);
    });

    it('AND returns true if both a and b are empty', () => {
      expect(fn(['foo', 'and', 'bar'], { foo: null, bar: null })).to.equal(true);
    });

    it('AND returns false if either a or b are non-empty', () => {
      expect(fn(['foo', 'and', 'bar'], { foo: 1, bar: null })).to.equal(false);
    });

    it('AND returns false if both a and b are non-empty', () => {
      expect(fn(['foo', 'and', 'bar'], { foo: 1, bar: 1 })).to.equal(false);
    });

    it('AND returns true if a, b, and c are all empty', () => {
      expect(fn(['foo', 'and', 'bar', 'and', 'baz'], { foo: null, bar: null, baz: null})).to.equal(true);
    });

    it('AND returns false if more than one of a, b, or c is empty', () => {
      expect(fn(['foo', 'and', 'bar', 'and', 'baz'], { foo: 1, bar: null, baz: null})).to.equal(false);
    });

    it('AND returns false if one of a, b, or c is empty', () => {
      expect(fn(['foo', 'and', 'bar', 'and', 'baz'], { foo: 1, bar: 1, baz: null})).to.equal(false);
    });

    it('AND returns false if a, b, and c are all non-empty', () => {
      expect(fn(['foo', 'and', 'bar', 'and', 'baz'], { foo: 1, bar: 1, baz: 1})).to.equal(false);
    });

    it('OR returns true if both a and b are empty', () => {
      expect(fn(['foo', 'or', 'bar'], { foo: null, bar: null })).to.equal(true);
    });

    it('OR returns true if either a or b are non-empty', () => {
      expect(fn(['foo', 'or', 'bar'], { foo: 1, bar: null })).to.equal(true);
    });

    it('OR returns false if both a and b are non-empty', () => {
      expect(fn(['foo', 'or', 'bar'], { foo: 1, bar: 1 })).to.equal(false);
    });

    it('OR returns true if a, b, and c are all empty', () => {
      expect(fn(['foo', 'or', 'bar', 'or', 'baz'], { foo: null, bar: null, baz: null})).to.equal(true);
    });

    it('OR returns true if more than one of a, b, or c is empty', () => {
      expect(fn(['foo', 'or', 'bar', 'or', 'baz'], { foo: 1, bar: null, baz: null})).to.equal(true);
    });

    it('OR returns true if one of a, b, or c is empty', () => {
      expect(fn(['foo', 'or', 'bar', 'or', 'baz'], { foo: 1, bar: 1, baz: null})).to.equal(true);
    });

    it('OR returns false if a, b, and c are all non-empty', () => {
      expect(fn(['foo', 'or', 'bar', 'or', 'baz'], { foo: 1, bar: 1, baz: 1})).to.equal(false);
    });

    it('XOR returns false if both a and b are empty', () => {
      expect(fn(['foo', 'xor', 'bar'], { foo: null, bar: null })).to.equal(false);
    });

    it('XOR returns true if a is empty and b is non-empty', () => {
      expect(fn(['foo', 'xor', 'bar'], { foo: 1, bar: null })).to.equal(true);
    });

    it('XOR returns true if a is non-empty and b is empty', () => {
      expect(fn(['foo', 'xor', 'bar'], { foo: null, bar: 1 })).to.equal(true);
    });

    it('XOR returns false if both a and b are non-empty', () => {
      expect(fn(['foo', 'xor', 'bar'], { foo: 1, bar: 1 })).to.equal(false);
    });

    it('XOR throws an error if you attempt to use it more than once', () => {
      expect(() => fn(['foo', 'xor', 'bar', 'xor', 'baz'], { foo: null, bar: null, baz: null })).to.throw(Error);
    });

    it('uses case-insensitive comparator', () => {
      expect(fn(['foo', 'AND', 'bar'], { foo: null, bar: null })).to.equal(true);
    });
  });

  describe('isGroupEmpty', () => {
    const fn = lib.isGroupEmpty;

    it('throws error if no ifEmpty property', () => {
      expect(() => fn({}, {}, 'foo')).to.throw('Placeholder for group \'foo\' needs \'ifEmpty\' statement!');
    });

    it('throws error if ifEmpty is not a string', () => {
      expect(() => fn({}, { ifEmpty: 1 }, 'foo')).to.throw('Placeholder for group \'foo\' needs \'ifEmpty\' statement!');
    });

    it('returns true if single empty field', () => {
      expect(fn({ foo: null }, { ifEmpty: 'foo' })).to.equal(true);
    });

    it('returns false if single non-empty field', () => {
      expect(fn({ foo: 1 }, { ifEmpty: 'foo' })).to.equal(false);
    });

    it('returns true if two empty fields', () => {
      expect(fn({ foo: null, bar: null }, { ifEmpty: 'foo and bar' })).to.equal(true);
    });

    it('returns true if three empty fields', () => {
      expect(fn({ foo: null, bar: null, baz: null }, { ifEmpty: 'foo and bar and baz' })).to.equal(true);
    });

    it('returns false if two non-empty fields', () => {
      // note: we're fully testing compareMultipleFields above, so we don't need to go through
      // all the possible combinations and comparators here
      expect(fn({ foo: 1, bar: 1 }, { ifEmpty: 'foo and bar' })).to.equal(false);
    });

    it('returns false if three non-empty fields', () => {
      // note: we're fully testing compareMultipleFields above, so we don't need to go through
      // all the possible combinations and comparators here
      expect(fn({ foo: 1, bar: 1, baz: 1 }, { ifEmpty: 'foo and bar and baz' })).to.equal(false);
    });
  });

  describe('hasPlaceholder', () => {
    const fn = lib.hasPlaceholder;

    it('returns false if no placeholder property', () => {
      groups.get.returns({ schema: {} });
      expect(fn()).to.equal(false);
    });

    it('returns true if permanent placeholder', () => {
      groups.get.returns({ schema: { [placeholderProp]: { permanent: true } } });
      expect(fn()).to.equal(true);
    });

    it('returns true if single empty field', () => {
      groups.get.returns({ fields: { bar: null }, schema: { [fieldProp]: true, [placeholderProp]: true } });
      expect(fn('foo', 'bar')).to.equal(true);
    });

    it('returns true if empty group', () => {
      groups.get.returns({ fields: { bar: null }, schema: { fields: ['bar'], [placeholderProp]: { ifEmpty: 'bar' } } });
      expect(fn('foo', 'baz')).to.equal(true);
    });

    it('returns true if empty component list', () => {
      // note: this may not currently work for component lists in the layout that alias to page areas
      // todo: check this and update if necessary
      groups.get.returns({ fields: { bar: null }, schema: { [componentListProp]: true, [placeholderProp]: true } });
      expect(fn('foo', 'bar')).to.equal(true);
    });

    it('returns true if empty component prop', () => {
      groups.get.returns({ fields: { bar: null }, schema: { [componentProp]: true, [placeholderProp]: true } });
      expect(fn('foo', 'bar')).to.equal(true);
    });

    it('thows error if it encounters something it cannot handle', () => {
      groups.get.returns({ fields: { bar: null }, schema: { [placeholderProp]: true } });
      expect(() => fn('foo', 'bar')).to.throw('Could not determine if I should add a placeholder for bar (in foo)');
    });
  });
});
