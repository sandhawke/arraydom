'use strict'

const htmlparser = require("htmlparser2");
const debug = require('debug')('lazydom')
const d2 = require('debug')('lazydom.fromHTML')
const d3 = require('debug')('d3')


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
  const tag = parts[0]
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
    if (key.startsWith('style.')) {
      style += key.slice(6) + ': ' + val + '; '
    } else {
      s += ' ' + key + '="' + val + '"'
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
    if (typeof child === 'string' || typeof child === 'number') {
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

function fromHTML (text) {
  let stack = []
  let index = -1
  let parser = new htmlparser.Parser({
	  onopentag: function (name, attribs) {
      d3('open', name)
      d2('open', name, index, stack)
      let me = [name, attribs]
      if (index >= 0) {
        stack[index].push(me)
      }
      index++
      stack[index] = me
      d2('leaving: ', index, stack)
	  },
	  ontext: function(text){

      if (text.match(/^\n *$/)) {
        // Odds are very, very good this is indenting stuff we don't
        // want....   But this is still imperfect.   Make it a flag?
        return
      }
      d3('text', JSON.stringify(text))
      stack[index].push(text)
	  },
	  onclosetag: function(name){
      d2('close', name)
      d3('close', name)
      index--
      d2('leaving: ', index, stack)
	  }
  }, {decodeEntities: true})
  parser.write(text)
  parser.end()
  moveClassToTag(stack[0])
  return stack[0]
}

function moveClassToTag (tree) {
  const tags = tree[0] || 'div'
  const attrs = tree[1] || {}
  const children = tree.slice(2)

  if (attrs.class) {
    tree[0] = tree[0] + ' ' + attrs.class
    delete attrs.class
  }
  // maybe class was the only attr; if so, make the array shorter
  if (tree.length === 2 && Object.getOwnPropertyNames(attrs).length === 0) {
    tree.length = 1
  }

  // Maybe this should be in another tree traversal?
  // If the attribute value can be cleanly converted to a number, do it
  for (let key of Object.getOwnPropertyNames(attrs)) {
    let val = attrs[key]
    let numval = Number(val)
    if (!Number.isNaN(numval)) {
      if (""+numval === val) {
        attrs[key] = numval
      }
    }
  }


  for (let child of children) {
    moveClassToTag(child)
  }
}

module.exports.toHTML = toHTML
module.exports.fromHTML = fromHTML

