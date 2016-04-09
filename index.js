'use strict'

const debug = require('debug')('lazydom')


const pad = Array(80).join(' ')  // don't bother to indent more than 80

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
  const tags = tree[0] || 'div'
  const attrs = tree[1] || {}
  const children = tree.slice(2)

  debug('starting with', tags)
  let s = ''
  const parts = tags.split(' ')
  debug('parts', parts)

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
  s += '<' + parts[0]
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
    if (key.startsWith('style.')) {
      style += key.slice(6) + ': ' + val + '; '
    } else {
      s += ' ' + key + '="' + val + '"'
    }
  }
  if (style !== '') {  // in case we finished the loop without emitting style
    s += ' style="' + style.trim() + '"'
  }

  if (children.length === 0) {
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
    if (indent >= 0) {
    s += '\n'
  }

  for (let child of children) {
    if (typeof child === 'function') {
      throw Error('someone else should have dealt with this first')
    }
    if (typeof child === 'string' || typeof child === 'number') {
      s += child
    }
    if (Array.isArray(child)) {
      s += this.serialize(child, indent + 1)
    }
  }

  if (indent >= 0) {
    s += pad.slice(0, (indent) * 2)
  }
  s += '</' + parts[0] + '>'
  if (oldIndent >= 0) {
    s += '\n'
  }

  return s
}

module.exports.toHTML = toHTML

