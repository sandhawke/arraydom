'use strict'

const he = require('he')

const node = require('./node')
const debug = require('debug')('arraydom.toHTML')

const pad = Array(80).join(' ')  // don't bother to indent more than 80

const selfClosing = {
  // from http://xahlee.info/js/html5_non-closing_tag.html
  // These are the tags that don't need an end-tag
  area: true,
  base: true,
  br: true,
  col: true,
  command: true,
  embed: true,
  hr: true,
  img: true,
  input: true,
  keygen: true,
  link: true,
  meta: true,
  param: true,
  source: true,
  track: true,
  wbr: true
}

function encode (s) {
  //console.log('ENCODE', JSON.stringify(s))
  if (typeof s === 'number') {
    s = '' + s
  }
  return he.encode(s, {useNamedReferences: true})
}

/*
  return a copy of this node where the second element is defintely the
  attribute object.  By calling this in all the right places, we allow
  people to omit that element.  Not sure yet whether that's a good
  practice.

  We might also want an in-place normalize-node or normalize-tree.

function normalizedNode (node) {
  if (node.length === 0) {
    throw Error('cant handle empty nodes')
  }
  if (node.length === 1) {
    return [ node[0], {} ]
  }
  if (typeof node[1] === 'object' && !Array.isArray(node[1])) {
    return node
  }
  const result = node.slice(1)
  result.splice(0,0, node[0], {})
  return result
}
*/

function toHTML (tree, options) {
  options = options || {}
  const s = new Serializer(options)
  let indent = 0
  if (options.compact) {
    indent = undefined
  }
  return s.serialize(tree, indent)
}

function Serializer (options) {
}


// would be more efficient to use some kind of output stream instead
// of a string, probably...
Serializer.prototype.serialize = function (tree, indent) {
  const tags = tree[0]
  const attrs = node.attrs(tree)
  const children = node.children(tree)

  debug('starting with', tags)
  let s = ''
  const parts = tags.split(' ')
  const tag = parts[0]
  debug('parts', parts)

  // 'document' is our pseudo-element for handling the fact that HTML
  // documents are not trees when you allow comments, doctype, etc.
  if (tag === 'document') {
    return children.map(toHTML).join('')
  }
  
  if (indent >= 0) {
    s += pad.slice(0, (indent) * 2)
  }
  /* 
     We don't want to indent flows of text.  There's no real way to
     know if we're in a flow of text because JavaScript could change
     the CSS on a div.  So we use this heuristic: if any of our
     children are text, we don't indent, and neither do any of our
     decendants
  */
  let oldIndent = indent
  if (indent >= 0) {
    for (let child of children) {
      if (typeof child === 'string' || typeof child === 'number') {
        indent = undefined
      }
    }
  }

  if (tag === 'processinginstruction') {
    s += '<' + children[0] + '>\n'
    return s
  }

  if (tag === 'comment') {
    s += '<!-- ' + children[0] + '-->\n'
    return s
  }

  s += '<' + tag
  if (parts.length > 1) {
    s += ' class="' + parts.slice(1).join(' ') + '"'
  }
  const attrnames = Object.getOwnPropertyNames(attrs).sort()
  let style = ''
  for (let key of attrnames) {
    let val = attrs[key]
    debug('key:', key)
    if (key.localeCompare('stylf') === 1) {
      debug('after style.')
      // we're past any style.foo entries
      if (style !== '') {
        s += ' style="' + style.trim() + '"'
        style = ''
      }
    }
    if (val === undefined) {
      throw Error('attribute value undefined for attr '+key)
    }
    if (key.startsWith('style.')) {
      style += key.slice(6) + ': ' + encode(val) + '; '
    } else {
      s += ' ' + key + '="' + encode(val) + '"'
    }
  }
  if (style !== '') {  // in case we finished the loop without emitting style
    s += ' style="' + style.trim() + '"'
  }

  if (selfClosing[tag]) {
    if (s.endsWith('"')) {
      s += ' ' 
    }
    s += '/>'
    if (oldIndent >= 0) {
      s += '\n'
    }
    return s
  }

  s += '>'
    if (indent >= 0 && children.length > 0) {
    s += '\n'
  }

  for (let child of children) {
    if (typeof child === 'function') {
      throw Error('someone else should have dealt with this first')
    }
    if (typeof child === 'string') {
      s += encode(child)
    }
    if (typeof child === 'number') {
      s += child
    }
    if (Array.isArray(child)) {
      s += this.serialize(child, indent + 1)
    }
  }

  if (indent >= 0 && children.length > 0) {
    s += pad.slice(0, (indent) * 2)
  }
  s += '</' + tag + '>'
  if (oldIndent >= 0) {
    s += '\n'
  }

  return s
}

module.exports = toHTML
