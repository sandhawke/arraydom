'use strict'
/*

  This is kind of like JSON.stringify (with indenting) except:

  - It uses less quoting (single not double, and not object props)
  - It keeps things on one line a lot more  (about 35% the number of lines)
  - The output conforms to 'standard'

  Very much a matter of taste.

  Maybe I should make this a different module?  There's nothing
  arraydom-ish about it...

*/

function serialize (node, wrap) {
  let s = ''
  let i = 0
  let p = 0
  let w = 80
  let wasPunc = false
  let newline = () => {
    s += '\n'
    s += ' '.repeat(i)
    p = i
  }
  let ostr = (x, delta) => {
    x = ''+x
    delta = delta || 0
    // console.log('outputing', JSON.stringify({x:x, p:p}))
    if (x.length > 1 && (p + x.length > w)) {
      newline()
    } else if (x === '[') {
      newline()
    } else {
      if (wasPunc) {
        s += ' '
        p++
      }
    }
    s += x
    p += x.length
    i += delta
    wasPunc = (x === ',' || x === ':')
  }
  walk(node, ostr)

  s += '\n' 
  if (wrap) {
    let ss = `'use strict'

module.exports = function () {
  return (${s})
}
`
    s = ss
  }
  
  return s
}

function quotedString (s) {
  // there are probably other things I need to check for....
  return "'" + s.replace(/'/g, "\\'").replace(/\n/g, '\\n') + "'"
}

function quotekey (s) {
  // curiously, it looks like JS doesn't care about reserved words in this
  // place in the grammar
  if (s.match(/^[a-zA-Z_$]+$/)) {
    return s
  } else {
    return quotedString(s)
  }
}

function walk (node, ostr) {
  if (typeof node === 'string') {
    ostr(quotedString(node))
  } else if (typeof node === 'number') {
    ostr(node)
  } else if (typeof node === 'object' && Array.isArray(node)) {
    ostr('[', 1)
    for (let i = 0; i < node.length; i++) {
      let child = node[i]
      if (i > 0) {
        ostr(',')
      }
      walk(child, ostr)
    }
    ostr(']', -1)
  } else if (typeof node === 'object') {
    ostr('{', 1)
    let i = 0
    for (let k of Object.getOwnPropertyNames(node)) {
      let child = node[k]
      if (i++ > 0) {
        ostr(',')
      }
      ostr(quotekey(k))
      ostr(':')
      walk(child, ostr)
    }
    ostr('}', -1)
  } else {
    throw Error('cant serialize type ' + typeof node)
  }
}

module.exports = serialize

// console.log(serialize(['a','hello', ['b', 'fosdfsdfsf asdf asdf asdf s df sdf sd f sdf sd fs df sd fs df sd fs d sd f sd f sd foo', 'barrrr'], 'world asdkfjkasjf kasdlkf laskd flk jaslkdfj alsk jflkj asdlk;fj al;ks dfl; js;ldfj asdl; fl; a']))

console.log(serialize(require('./o1.json'), true))

// console.log(serialize(require('./node_modules/faucet/node_modules/through2/node_modules/xtend/package.json')))



