'use strict'

const htmlparser = require('htmlparser2')
// const debug = require('debug')('arraydom.fromHTML')
const d2 = require('debug')('arraydom.fh2')
const d3 = require('debug')('arraydom.fh3')

function parseDocument (text) {
  const wrapper = ['document', {}]
  const stack = [ wrapper ]
  let index = 0
  const parser = new htmlparser.Parser({
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
    ontext: function (text) {
      if (text.match(/^\r?\n *$/)) {
        // Odds are very, very good this is indenting stuff we don't
        // want....   But this is still imperfect.   Make it a flag?
        return
      }
      d3('text', JSON.stringify(text))
      stack[index].push(text)
    },
    onclosetag: function (name) {
      d2('close', name)
      d3('close', name)
      index--
      d2('leaving: ', index, stack)
    },
    oncomment: function (text) {
      stack[index].push(['comment', {}, text])
    },
    onprocessinginstruction: function (name, data) {
      stack[index].push(['processinginstruction', {name: name}, data])
    }
  }, {decodeEntities: true})
  parser.write(text)
  parser.end()
  moveClassToTag(stack[0])
  return wrapper
}

function moveClassToTag (tree) {
  // const tags = tree[0] || 'div'
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
      if ('' + numval === val) {
        attrs[key] = numval
      }
    }
  }

  for (let child of children) {
    moveClassToTag(child)
  }
}

function parseElement (text) {
  const document = parseDocument(text)
  if (document.length !== 3) {
    throw new Error('parseElement didnt fine exactly one element, found:', JSON.stringify(document.slice(2)))
  }
  return document[2]
}

module.exports.parseDocument = parseDocument
module.exports.parseElement = parseElement
