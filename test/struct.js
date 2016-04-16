'use strict'

const test = require('tape')

// just include struct.js but call it arraydom for testing
const arraydom = require('../struct')


test('children start at [1..]', t => {
  t.plan(1)
  const a = ['div', 'a', 'b']
  t.deepEqual(arraydom.children(a), ['a', 'b'])
})

test('children start at [2..]', t => {
  t.plan(1)
  const a = ['div', {}, 'a', 'b']
  t.deepEqual(arraydom.children(a), ['a', 'b'])
})

test('forEachChild start at [2..]', t => {
  t.plan(1)
  let out = []
  const a = ['div', {}, 'a', 'b']
  arraydom.forEachChild(a, x => { out.push(x) })
  t.deepEqual(out, ['a', 'b'])
})

test('forEachChild start at [1..]', t => {
  t.plan(1)
  let out = []
  const a = ['div', 'a', 'b']
  arraydom.forEachChild(a, x => { out.push(x) })
  t.deepEqual(out, ['a', 'b'])
})

test('attrNames', t => {
  t.deepEqual(arraydom.attrNames(['div']), [])
  t.deepEqual(arraydom.attrNames(['div', 'hi']), [])
  t.deepEqual(arraydom.attrNames(['div', {}]), [])
  t.deepEqual(arraydom.attrNames(['div', {}, 'hi']), [])
  t.deepEqual(arraydom.attrNames(['div', {a:1}, 'hi']), ['a'])
  t.deepEqual(arraydom.attrNames(['div', {a:1,b:1}, 'hi']), ['a','b'])
  t.deepEqual(arraydom.attrNames(['div c']), ['class'])
  t.deepEqual(arraydom.attrNames(['div c d e']), ['class'])
  t.deepEqual(arraydom.attrNames(['div c', {a:1}]), ['a', 'class'])
  t.deepEqual(arraydom.attrNames(['div c', {$b:1}]), ['class', 'style'])
  t.deepEqual(arraydom.attrNames(['div', {'style.b':1}]), ['style'])
  t.end()
})

test('style attr', t => {
  t.equal(arraydom.attr(['div'], 'style'), undefined)
  t.equal(arraydom.attr(['div', {$a:1}], 'style'), 'a: 1')
  t.equal(arraydom.attr(['div', {'style.a':1}], 'style'), 'a: 1')
  t.equal(arraydom.attr(['div', {$b:2, 'style.a':1}], 'style'), 'a: 1; b: 2')
  t.equal(arraydom.attr(['div', {$b:2, 'style.a':1,
                                 style:'foo;   '}], 'style'), 'a: 1; b: 2; foo')
  t.end()
})

test('class attr', t => {
  t.equal(arraydom.attr(['div'], 'class'), undefined)
  t.equal(arraydom.attr(['div a'], 'class'), 'a')
  t.equal(arraydom.attr(['div b a'], 'class'), 'a b')
  t.equal(arraydom.attr(['div b a', {'class':'a'}], 'class'), 'a b')
  t.equal(arraydom.attr(['div b a', {'class':'c d'}], 'class'), 'a b c d')
  t.equal(arraydom.attr(['div b a', {'class':'a c d'}], 'class'), 'a b c d')
  t.equal(arraydom.attr(['div', {'class':'c'}], 'class'), 'c')
  t.end()
})

test('other attr', t => {
  t.equal(arraydom.attr(['div'], 'a1'), undefined)
  t.equal(arraydom.attr(['div', {a1:1} ], 'a1'), 1)
  t.equal(arraydom.attr(['div', {a1:1, a2:2} ], 'a1'), 1)
  t.equal(arraydom.attr(['div', {a1:1, a2:2} ], 'a2'), 2)
  t.equal(arraydom.attr(['div', {a1:1, a2:2} ], 'a3'), undefined)
  t.end()
})

test('match', t => {
  t.equal(arraydom.match(['div'], 'div'), true)
  t.equal(arraydom.match(['div'], 'span'), false)

  t.equal(arraydom.match(['div foo'], 'div'), true)
  t.equal(arraydom.match(['div foo'], 'span'), false)

  t.equal(arraydom.match(['div foo'], '.foo'), true)
  t.equal(arraydom.match(['div foo'], '.bar'), false)
  t.equal(arraydom.match(['div foo bar'], '.bar'), true)

  t.equal(arraydom.match(['div foo', {id:'x'}], '.foo'), true)
  t.equal(arraydom.match(['div foo', {id:'x'}], '.bar'), false)
  t.equal(arraydom.match(['div foo', {id:'x'}], '#x'), true)
  t.equal(arraydom.match(['div foo', {id:'x'}], '#y'), false)

  t.end()
})

test('expanded', t => {
  t.deepEqual(arraydom.expanded(['div']), ['div', {}])
  t.deepEqual(arraydom.expanded(['div b a']), ['div', {'class':'a b'}])
  t.deepEqual(arraydom.expanded(['div b a',['span']]),
              ['div', {'class':'a b'}, ['span', {} ]])
  t.end()
})

test('compacted', t => {
  t.deepEqual(arraydom.compacted(['div']), ['div'])
  t.deepEqual(arraydom.compacted(['div', {}]), ['div'])
  t.deepEqual(arraydom.compacted(['div', {}, 'a']), ['div', 'a'])
  t.deepEqual(arraydom.compacted(['div', {'class':'b a'}]), ['div a b'])
  t.deepEqual(arraydom.compacted(['div', {'class':'a b'}, ['span', {} ]]),
              ['div a b',['span']])
  t.deepEqual(arraydom.compacted(['div', {'class':'a b',a:1}, ['span', {} ]]),
              ['div a b', {a:1}, ['span']])

  t.end()
})
