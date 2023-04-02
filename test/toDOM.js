'use strict'

const test = require('tape')

// call it arraydom for testing
const arraydom = require('../toDOM')


test('digest', t => {
  t.plan(3)
  const a = ['div', {c:20, b:10, a:5}, 'a', 'b', ['span', {}, 'foo', 'bar']]
  const b = ['div', {a:5, b:10, c:20}, 'a', 'b', ['span', {}, 'foo', 'bar']]
  t.deepEqual(a, b)
  arraydom._setDigest(a)
  arraydom._setDigest(b)
  console.log('a came back:', a)
  t.equal(a[1]._digest, b[1]._digest)
  console.log('a still:', a)
  t.equal(a[1]._digest, 'div {"a":5,"b":10,"c":20} "a" "b" (span {} "foo" "bar")')
})
