'use strict'
/*

  todo:
  - reorg most of this as driven by external json

*/

const test = require('tape')
const arraydom = require('..')

let compact=true

function run (t, tree, html) {
  t.plan(2)
  t.equal(arraydom.stringify(tree, {compact: compact}), html)
  t.deepEqual(arraydom.parseElement(html), tree)
}

function run1 (t, tree, html) {
  t.plan(1)
  t.equal(arraydom.stringify(tree, {compact: compact}), html)
}

test('minimal element', t => {
  let tree = ['div']
  let html = '<div></div>'
  run(t, tree, html)
})

test('single class', t => {
  let tree = ['div foo']
  let html = '<div class="foo"></div>'
  run(t, tree, html)
})

test('multiple classes', t => {
  let tree = ['div foo bar baz']
  let html = '<div class="foo bar baz"></div>'
  run(t, tree, html)
})

test('string attr', t => {
  let tree = ['div', {a:'b'}]
  let html = '<div a="b"></div>'
  run(t, tree, html)
})

test('number attr gets quoted', t => {
  let tree = ['div', {a:1}]
  let html = '<div a="1"></div>'
  run(t, tree, html)
})

test('alphabetic order of attrs', t => {
  let tree = ['div', {a:1, b:2, c:3}]
  let html = '<div a="1" b="2" c="3"></div>'
  run(t, tree, html)
})

test('style attrs', t => {
  let tree = ['div', {
    a:1,
    z:2,
    'style.border':'solid red 1px',
    'style.margin-left': '3em'}]
  let html = '<div a="1" style="border: solid red 1px; margin-left: 3em;" z="2"></div>'
  run1(t, tree, html)
})

test('single string child', t => {
  let tree = ['div', {}, 'hello']
  let html = '<div>hello</div>'
  run(t, tree, html)
})

test('multiple string children', t => {
  let tree = ['div', {}, 'Hello', ', ', '', 'World', '!']
  let html = '<div>Hello, World!</div>'
  run1(t, tree, html)
})

test('self-closing', t => {
  let tree = ['hr']
  let html = '<hr/>'
  run(t, tree, html)
})

test('self-closing with attr', t => {
  let tree = ['hr', {a:1}]
  let html = '<hr a="1" />'
  run(t, tree, html)
})

test('single simple child element', t => {
  let tree = ['div', {}, ['span']]
  let html = '<div><span></span></div>'
  run(t, tree, html)
})

test('four child elements', t => {
  let tree = ['div', {},
              ['span a'],
              ['span b'],
              ['span c'],
              ['span d']
              ]
  let html = '<div><span class="a"></span><span class="b"></span><span class="c"></span><span class="d"></span></div>'
  run(t, tree, html)
})

test('child element tree', t => {
  let tree = ['div', {},
              ['span a', {},
               ['span b']
              ]
             ]
  let html = '<div><span class="a"><span class="b"></span></span></div>'
  run(t, tree, html)
})

test('four-node child element tree', t => {
  let tree = ['div', {},
              ['span a'],
              ['span b'],
              ['span c', {},
               ['span c1']
              ]
             ]
  let html = '<div><span class="a"></span><span class="b"></span><span class="c"><span class="c1"></span></span></div>'
  run(t, tree, html)
})

test('complex child element tree', t => {
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
               'hello', ['br'], 'there'
              ]
             ]
  let html = '<div><span class="a"></span><span class="b"></span><span class="c"><span class="c1"></span><span class="c2"><span class="c2x"></span><span class="c2y"></span></span></span><span class="d">hello<br/>there</span></div>'
  run(t, tree, html)
})

test('mixed content', t => {
  let tree = ['div',
              {},
              'a',
              ['br'],
              'b',
              ['br'],
              'c'
              ]
  let html = '<div>a<br/>b<br/>c</div>'
  run(t, tree, html)
})

test('indenting', t => {
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
               'hello', ['br'], 'there',
              ]
             ]
  let html = 
`<div>
  <span color="4"></span>
  <hr/>
  <span class="a">foo</span>
  <span class="b"></span>
  <span class="c">
    <span class="c1"></span>
    <span class="c2">
      <span class="c2x"></span>
      <span class="c2y"></span>
    </span>
  </span>
  <span class="d">hello<br/>there</span>
</div>
`

  compact = false
  run(t, tree, html)
  compact = true
})

test('skip attrs', t => {
  let tree = ['div', 'hello']
  let html = '<div>hello</div>'
  // just one way for now; we don't denomalize on read (yet)
  run1(t, tree, html)
})
  
