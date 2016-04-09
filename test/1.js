'use strict'
const test = require('tape')
const lazydom = require('..')

test('minimal element', t => {
  t.plan(1)
  let tree = ['div']
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div/>')
})

test('single class', t => {
  t.plan(1)
  let tree = ['div foo']
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div class="foo" />')
})

test('multiple classes', t => {
  t.plan(1)
  let tree = ['div foo bar baz']
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div class="foo bar baz" />')
})

test('string attr', t => {
  t.plan(1)
  let tree = ['div', {a:'b'}]
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div a="b" />')
})

test('number attr gets quoted', t => {
  t.plan(1)
  let tree = ['div', {a:1}]
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div a="1" />')
})

test('alphabetic order of attrs', t => {
  t.plan(1)
  let tree = ['div', {a:1, b:2, c:3}]
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div a="1" b="2" c="3" />')
})

test('style attrs', t => {
  t.plan(1)
  let tree = ['div', {
    a:1,
    z:2,
    'style.border':'solid red 1px',
    'style.margin-left': '3em'}]
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div a="1" style="border: solid red 1px; margin-left: 3em;" z="2" />')
})

test('single string child', t => {
  t.plan(1)
  let tree = ['div', {}, 'hello']
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div>hello</div>')
})

test('multiple string children', t => {
  t.plan(1)
  let tree = ['div', {}, 'Hello', ', ', '', 'World', '!']
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div>Hello, World!</div>')
})

test('single simple child element', t => {
  t.plan(1)
  let tree = ['div', {}, ['span']]
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div><span/></div>')
})

test('four child elements', t => {
  t.plan(1)
  let tree = ['div', {},
              ['span a'],
              ['span b'],
              ['span c'],
              ['span d']
              ]
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div><span class="a" /><span class="b" /><span class="c" /><span class="d" /></div>')
})

test('child element tree', t => {
  t.plan(1)
  let tree = ['div', {},
              ['span a', {},
               ['span b']
              ]
             ]
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div><span class="a"><span class="b" /></span></div>')
})

test('four-node child element tree', t => {
  t.plan(1)
  let tree = ['div', {},
              ['span a'],
              ['span b'],
              ['span c', {},
               ['span c1']
              ]
             ]
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div><span class="a" /><span class="b" /><span class="c"><span class="c1" /></span></div>')
})


test('complex child element tree', t => {
  t.plan(1)
  let tree = ['div', {},
              ['span a'],
              ['span b'],
              ['span c', {},
               ['span c1'],
               ['span c2', {},
                ['span c2x'],
                ['span c2y']
               ]
              ],
              ['span d', {},
               'hello', ' ', 'there'
              ]
             ]
  let html = lazydom.toHTML(tree, {compact: true})
  t.equal(html, '<div><span class="a" /><span class="b" /><span class="c"><span class="c1" /><span class="c2"><span class="c2x" /><span class="c2y" /></span></span><span class="d">hello there</span></div>')
})


test('indenting', t => {
  t.plan(1)
  let tree = ['div', {},
            ['span', {color:4}],
            ['hr'],
              ['span a', {}, 'foo'],
              ['span b'],
              ['span c', {},
               ['span c1'],
               ['span c2', {},
                ['span c2x'],
                ['span c2y']
               ]
              ],
              ['span d', {},
               'hello', ['span dd'], ' ', 'there',
              ]
             ]
  let html = lazydom.toHTML(tree, {compact: false})
  t.equal(html, `<div>
  <span color="4" />
  <hr/>
  <span class="a">foo</span>
  <span class="b" />
  <span class="c">
    <span class="c1" />
    <span class="c2">
      <span class="c2x" />
      <span class="c2y" />
    </span>
  </span>
  <span class="d">hello<span class="dd" /> there</span>
</div>
`)
})

