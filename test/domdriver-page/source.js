'use strict'

const domdriver = require('../../domdriver')
const EventEmitter = require('eventemitter3')

const db1 = (() => {
  const data = { now: 'starting' }
  const db      = new EventEmitter()
  db.values = () => data
  
  let n = 0
  if (true) {
    setInterval( () => {
      data.now = '' + (new Date()) + '  counter=' + n++
      db.emit('change')
    }, 1)
  }
  return db
})()

const db2 = (() => {
  const data = { now: 'starting' }
  const db = {}
  db.values = () => data
  
  let n = 0
  if (true) {
    setInterval( () => {
      data.now = '' + (new Date()) + '  counter=' + n++
    }, 1)
  }
  return db
})()


const db3 = (() => {
  const data = { now: 'starting' }
  const db = {}
  db.values = () => data
  
  let n = 0
  if (true) {
    setInterval( () => {
      data.now = '' + (new Date()) + '  counter=' + n++
    }, 1)
  }
  return db
})()


domdriver.create('e1', [func, {$fontWeight: 'bold'}, db1] )
domdriver.create('e2', [func, {$fontWeight: 'bold'}, db2], { poll: 1} )

const dd3 = domdriver.create('e3', [func, {$fontWeight: 'bold'}, db3] )
setInterval( () => {
  dd3.touch()
}, 1)

function func (attrs, q) {
  // console.log('func', attrs, q.values().now)
  return [b, attrs, q.values().now]
}

// Amusingly let you say [b, ...] instead of ['b', ...]
function b (...args) {
  const result = ['b']
  Array.prototype.push.apply(result, args)
  return result
}

(function b1 () {
  const tree = ['p', {}, ['button', { onclick: click}, 'Click Me']]
  const dd = domdriver.create('b1', tree)
  function click () {
    tree.push(' Clicked! ')
    dd.touch()
  }
})();


(() => {
  const tree = ['p', {}, ['button', { onclick: click}, '1-second-poll Click Me']]
  const dd = domdriver.create('b2', tree, { poll: 1000} )
  function click () {
    tree.push(' Clicked! ')
  }
})();

(() => {
  const tree = ['p', {}, ['input', { onchange: change,
                                     oninput: input,
                                     placeholder: 'type here!'}]]
  const dd = domdriver.create('b3', tree)
  function input (ev) {
    tree.splice(3)
    tree[3] = ' text: ' + JSON.stringify(ev.target.value)
    dd.touch()
  }
  function change (ev) {
    tree.push(' (got change event) ')
    dd.touch()
  }
})();
