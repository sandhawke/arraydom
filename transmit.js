'use strict'
/*
  Converts an arraydom tree to and from a JSON-able object.  The issue
  is functions that might be in the tree

  Should we use JSON.parse & stringify's second argument?

  No, for postMessage we don't need to stringify.  That's probably
  slower.

*/


const struct = require('./struct')


/* 
   MODIFIES IN PLACE
   ['div', {onclick: foo}], [a,b]
   into
   ['div', {onclick: {callback:2}}], [a,b,foo]
 */
function makeSafe (tree, callbacks) {
  struct.walk(tree, node => {
    if (struct.attrsPresent(node)) {
      const a = node[1]
      for (let prop of Object.getOwnPropertyNames(a)) {
        const val = a[prop]
        if (typeof val === 'function') {
          const index = callbacks.length
          callbacks.push(val)
          a[prop] = { callback: index }
        }
      }
    }
  })
}

/*
   MODIFIES IN PLACE
   ['div', {onclick: {callback: 2}}], [a,b]
   into
   ['div', {onclick: callbackMaker(2)}], [a,b,foo]
*/
function makeUnsafe (tree, callbackMaker) {
  struct.walk(tree, (node) => {
    if (struct.attrsPresent(node)) {
      const a = node[1]
      for (let prop of Object.getOwnPropertyNames(a)) {
        const val = a[prop]
        if (val.hasOwnProperty('callback')) {
          a[prop] = callbackMaker(val.callback)
        }
      }
    }
  })
}


module.exports.makeSafe = makeSafe
module.exports.makeUnsafe = makeUnsafe
