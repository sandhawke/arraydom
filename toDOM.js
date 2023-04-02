'use strict'
/*

  Only useful in browser.  Just use toHTML if you're on the server.

  HALF-WRITTEN.   USES HACK FOR NOW, instead of adjustment algorthm.

  Possible algorithm that does NOT support relocating DOM nodes if the
  arraydom just moves things around:



  for each a, b
  assume type of a and b are the same
  for i from 0 to len b
  if type a[i] == type b[i]
  make a[i] match b[i]
  align all the attrs   getAttributeNames()
  align the children recursively

  combine adjacent text nodes first, as part of expand()
  nodeType 3 is text node
  else
  remove a[i]
  generate a new a[i] from b[i]
  if a is longer than b, then remove extra children


  The reason we wrap the DOM eg with .on(...) is so that this stuff
  can be called from a sandbox, through a layer that makes unique
  node ids.

*/

const hack = false

const struct = require('./struct')
const debug = require('debug')('arraydom.toDOM')
const toHTML = require('./toHTML')

// window.jsdebug = require('debug')
// window.jsdebug.enable('arraydom.toDOM')
debug('debugging!')
//        ===>  jsdebug.enable('*')



function createDOMDriver (startingElem, startingTree) {
  const dd = {}
  let elem = startingElem
  let tree = startingTree
  const listeners = []

  dd.setElement = (newElem) => {
    elem = newElem
    dd.update()
  }
  

  /*
    make necessary dom calls so it displays tree

  */
  dd.update = function (newTree) {
    if (newTree) {
      tree = newTree
    }
    if (!elem || !tree) return

      // temporary hack -- will cause problems for user, like if they're
      // typing in a text box.
      const html = toHTML(struct.expanded(tree))
      //console.log('updating innerHTML to', html)
      //
      elem.innerHTML = html
      // debug('all listeners:', listeners)
      for (let l of listeners) {
        addEventListener(l)
      }
  }

  // Very similar to update, but instead of updating the dom node we
  // were told about, it uses the id of the root of the tree.
  dd.replace = function (tree) {
    const html = toHTML(struct.expanded(tree))
    //console.log(html)
    // needs to be outerHTML to affect the properties....
    document.getElementById(tree[1].id).outerHTML = html
    // debug('all listeners:', listeners)
    for (let l of listeners) {
      addEventListener(l)
    }
  }
  
  function addEventListener (l) {
    // debug('maybe adding listener', l)

    const target = document.getElementById(l.id)
    if (target) {
      // debug('yes, target exists')
      // um, wtf is this here three times?    
      target.removeEventListener(l.eventName, l.cb)
      target.removeEventListener(l.eventName, l.cb)
      target.removeEventListener(l.eventName, l.cb)
      target.addEventListener(l.eventName, l.cb)
    } else {
      // maybe remove it?  No, they might not have added it yet...
    }
  }
  
  // for now, we need an id.   kind of annoying to generate those.
  dd.on = (eventName, id, cb) => {
    const l = { id: id, eventName: eventName, cb: cb }
    if (elem) {
      addEventListener(l)
    }
    listeners.push(l)
  }

  dd.value = (id) => {
    return document.getElementById(id).value
  }
  
  return dd
}



function adjustChildren (parent, newTree) {
  
}

function adjustChild(parent, offset, newTree) {
  adjustType(parent, offset, newTree)
  adjustTag(parent, offset, newTree)
  forEachDOMChild(
    
  )

  /*

    run through the dom looking for data-arraydom-digest
    if it matches, leave that alone
    ... but maybe re-attach it elsewhere?

    Basically, build a new DOM from re-using exist dom nodes
    with that digest

    WE keep a table of dom nodes we build from some digest.

    But we might have the same digest occur twice in the tree.

    Hrmph.

  */
}


// maybe move to this instead...?
// ... if we need getTree
function createDigestMap () {
  const dm = {}
  const digests = new WeakMap()
  const trees = new WeakMap()

  dm.addTree = function (tree) {
  }

  dm.getDigest = function (tree) {
  }

  db.getTree = function (digest) {
  }

  return dm
}


/**
 * Set attr _digest to be a digest of this subtree, so we can detect
 * changes and find subtrees after they've moved.  It is opaque, and
 * should only be compared for equality.  (In some languages a hash
 * would make snese, but in JS in the browser, just using a
 * string serialization is probably better.)
 *
 * Tree must be .expanded first so we can set the _digest attr.
 * Alternatively, we could store the digests in a WeakMap.
 */
function setDigest (tree) {
  // debug('sd called', tree)
  if (typeof tree === 'object') {
    struct.forEachChild(tree, setDigest)
  } else {
    return
  }
  const parts = []
  parts.push(struct.tagName(tree))
  parts.push(sortedStringify(struct.rawAttrs(tree)))
  struct.forEachChild(tree, child => {
    if (typeof child === 'object') {
      parts.push('(' + child[1]._digest + ')')
    } else {
      parts.push(JSON.stringify(child))
    }
  })
  tree[1]._digest = parts.join(" ")
  // debug('sd assiged _digest, so ', tree)
}

function sortedStringify (obj) {
  if (typeof obj === 'object' && !Array.isArray(obj)) {
    const parts = []
    const keys = Object.getOwnPropertyNames(obj)
    keys.sort()
    for (let key of keys) {
      parts.push(JSON.stringify(key) + ':' + sortedStringify(obj[key]))
    }
    return '{' + parts.join(',') + '}'
  } else if (typeof obj === 'string' || typeof obj === 'number') {
    return JSON.stringify(obj)
  } else {
    throw TypeError('sortedStringify doesnt handle arrays, etc')
  }
}

module.exports.createDOMDriver = createDOMDriver

// for testing
module.exports._setDigest = setDigest







/** 
 * Given a DOM node, and one of our listernExpressions, add its
 * listener to the node if it matches.  This needs to be called for
 * every DOM node if there's a new listenerExpression and for every
 * listenerExpression if there's a new DOM node.
 *
 * Oh, but what if a DOM node changes in a way that might change
 * whether it matches?  Ah, we have at MOST one listener of each type,
 * basically we just use onclick internally, to our dispatching listener
 */
function addListenerIfMatch (elem, listenerExpression) {
}

// http://stackoverflow.com/questions/4386300/javascript-dom-how-to-remove-all-events-of-a-dom-object

function updateDOM (elemParent, index, newTree, listenerExpressions) {
  // adjust elems type or tagname?  (have to replace)

  // adjust this elements attributes to match

  // diff children -- if someone adds before the end, can I shift?  Nope.
  // so... update existing children to length match
  // remove children if newTree is shorter
  // add children if it's longer
}

////////////////////////////////////////////////////////////////

/*

// Test: should we treat FROM and TO as the same node during
// alignChildren?  It's okay to differ in some ways like style and
// children, but the nodetype and tagname and id have to be the same.
// (We're trusting you're not going to change the id.  If you do,
// it's harmless enough, just more work.)
function match (from, to) {
  if (from.nodeType === from.ELEMENT_NODE) {
    if (from.tagname !== struct.tagName(to)) return false
    if (from.getAttribute('id') !== struct.attr(to, 'id')) return false
    return true
  }
  if (from.nodeType === from.TEXT_NODE) {
    if (typeof to !== 'string') return false
    return (to.textContent === from)
  }
  throw Error('toDOM.match given unknown type DOM node ', from.nodeType)
}

// Return the index (or -1) of the first match of element in TO,
// at of after minIndex
function findMatch(element, to, minIndex) {
  for (let j = minIndex; j < struct.numChildren(to); j++) {
    if (match(element, struct.child(to, j))) return j
  }
  return -1
}

function alignChildren (from, to) {
  debug('alignChildren', from)
  let i = 0
  let j = 0
  while (i < from.children.length) {
    let child = from.children[i]
    let j = findMatch(child, to, j)
    if (j === i) {
      debug('alignChildren match at', i)
      // we're aligned at this node, great! move foward
      i++
      j++
      alignChildren (child, struct.child(to,i))
      continue
    }
    if (j === -1) {
      debug('alignChildren delete child at', i)
      // this DOM element does not occur in TO, so delete it.
      // i stays the same, but will point to a different node,
      // and we might exit the loop if there's no next sibling.
      child.remove()
      continue
    }
    // this DOM element occurs later, so create new children
    // for the interving nodes
    for ( ;i < j; j++) {
      debug('alignChildren insert child at', i)
      newTree = toDOMTree(struct.child(to, i))
      from.insertBefore(newTree, child)
    }
  }
  adjustAttributes(from, to)
}

// This is lame about style attributes.
// Setting style="....." a lot might be slow, or worse.
// but ... I don't know a better way...
//
// we COULD say you have to set $stuff to null to clear
// it, you can't just not provide it...  That violates our
// stated statefree semantics, though.
//
// OH, we could use from.dataset.arraydomStyle to be a copy
// of the style WE set on this in the past, so we know what
// we have to change.   That's not bad.....
//
function adjustAttributes (from, to) {
  const old = new Set()
  if (from.getAttributeNames) { // pretty new in DOM
    for (let name of from.getAttributeNames()) {
      old.add(name)
    }
  }
  for (let name of struct.attrNames(to)) {
    let val = struct.attr(to, name)
    if (val === null) {
      from.deleteAttribute(name)
    } else {
      from.setAttribute(name, val)
    }
    old.delete(name)
  }
  for (let name of old) {
    from.deleteAttribute(name)
  }
}

function toDOMTree(t) {
  if (typeof t === 'string') {
    return document.createTextNode(t)
  }
  if (typeof t === 'number') {
    return document.createTextNode('' + t)
  }
  if (Array.isArray(t)) {
    const node = document.createElement('div')
    node.outerHTML = toHTML(struct.expanded(tree))
    return node
  }
  throw Error('toDOMTree called on bad type')
}

*/
