'use strict'

const diff = require('arraydom-diff')
const fromHTML = require('./fromHTML')

/*
  Given a DOM element (or DOM element id), and an arraydom tree, start
  watching the tree, and every time the tree changes, make the
  corresponding updates to the DOM.

  Call dd.stop() when you want this all to go away...

  If you like, you can call dd.touch() after any time you change the
  tree.  After the first time you that, we'll only check the tree when
  you do that.  It's probably not necessary unless your tree is many
  thousands of nodes.

  dd.on(...) for event handling

  FUNCTIONS: 

  - If [0] of any subtree is a function, then

  ** that functions is invoked with the rest of its array as its
  ** arguments, and then its replaced by whatever it returns, which is
  ** then checked for functions.


  ** if any of the args have an .on function, then we call
  ** .on('updated', ...) to trigger re-evaluating the function.
  ** (which means it really just sets onupdated to touch for any ee
  ** argument objects in the tree.)  This means touch handling will be
  ** turned on in that case.

*/

function scalar (x) {
  return (typeof x === 'string' || typeof x === 'number')
}

function createDOMDriver(node, tree, window) {
  let usingTouch = false
  if (typeof node === 'string') {
    if (node.startsWith('#')) node = node.slice(1)
    node = document.getElementById(node)
  }
  let treeCopy = fromHTML.parseElement(node.outerHTML)
  let touched = true

  function touch () {
    usingTouch = true
    touched = true
  }

  function paint (timestamp) {
    if (touched || !usingTouch) {
      const evaldTree = evalFunctions(tree, touch)
      const delta = diff.diff(treeCopy, evaldTree)
      treeCopy = evaldTree
      diff.patch(node, delta, window.document)
      touched = false
    }
  }

  window.requestAnimationFrame(paint)
  const dd = {}
  dd.touch = touch
  return dd
}

// we end up evaling more than necessary -- when any change to any
// data happens, trigger a re-eval of the whole tree.   But it's simple
// and probably good enough.
function evalFunctions (a, onChange) {
  if (!onChange) onChange = () => {}
  if (scalar(a)) {
    return a
  }
  if (Array.isArray(a)) {
    if (typeof a[0] === 'function') {
      const args = a.slice(1)
      for (let arg of args) {
        if (typeof arg.on === 'function') {
          arg.on('changed', onChange)
        }
      }
      const output = a[0].apply(null, args)
      return evalFunctions(output, onChange)
    } else {
      const result = []
      for (let aa of a) {
        result.push(evalFunctions(aa, onChange))
      }
      return result
    }
  }
  if (typeof (a) === 'object') {
    return Object.assign({}, a)
  }
  console.error('unexpected object', a)
  throw Error('no other types implemented')
}

module.exports.evalFunctions = evalFunctions
module.exports.createDOMDriver = createDOMDriver
