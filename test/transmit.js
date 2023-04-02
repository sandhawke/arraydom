'use strict'

const test = require('tape')

// call it arraydom for testing
const arraydom = require('../transmit')


test('makeSafe & makeUnsafe', t => {
  t.plan(4)
  const f1 = (a, b) => a + b
  const f2 = (a, b) => a - b
  const a = ['div', {c:20, b:10, a:5, x: f1}, 'a', 'b', ['span', {y: f2}, 'foo', 'bar']]
  const ax= ['div', {c:20, b:10, a:5, x: f1}, 'a', 'b', ['span', {y: f2}, 'foo', 'bar']]   // deepcopy via copypaste
  const b = ['div', {a:5, b:10, c:20, x: {callback: 0}}, 'a', 'b', ['span', {y: {callback: 1}}, 'foo', 'bar']]
  const callbacks = []
  t.deepEqual(a, ax)
  arraydom.makeSafe(a, callbacks)
  t.deepEqual(callbacks, [f1, f2])
  t.deepEqual(a, b)
  function ff (n) { return callbacks[n] }
  arraydom.makeUnsafe(a, ff)
  t.deepEqual(a, ax)
})
