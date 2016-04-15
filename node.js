'use strict'

const debug = require('debug')('arraydom.toHTML')

function children (node) {
  if (typeof node[1] === 'object' && !Array.isArray(node[1])) {
    return node.slice(2)
  }
  return node.slice(1)
}

function attrs (node) {
  if (typeof node[1] === 'object' && !Array.isArray(node[1])) {
    return node[1]
  }
  return {}
}

module.exports.attrs = attrs
module.exports.children = children



/*
function getElementById (tree, s) { // byId
  const attrs = nodeAttrs(tree)
  const children = nodeChildren(tree)
  if (attrs.id === s) {
    return tree
  }
  for (let child of children) {
    let result = getElementById(child, s)
    if (result) {
      return child
    }
  }
  return undefined
}

function getElementsByTagName (tree, s) {   // byTag
}

function getElementsByClass (tree, s) {   // byClass
}
*/
