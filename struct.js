'use strict'

function attrsPresent (node) {
  const x = node[1]
  return (typeof x === 'object' && !Array.isArray(x))
}

function rawAttrs (node) {
  const x = node[1]
  if (typeof x === 'object' && !Array.isArray(x)) {
    return x
  }
  return {}
}

function children (node) {
  if (attrsPresent(node)) {
    return node.slice(2)
  }
  return node.slice(1)
}

function forEachChild (node, f) {
  const from = attrsPresent(node) ? 2 : 1
  for (let i = from; i < node.length; i++) {
    f(node[i])
  }
}

function tagName (node) {
  const parts = node[0].split(' ')
  return parts[0]
}

function embeddedClassNames (node) {
  const parts = node[0].split(' ')
  if (parts.length > 1) {
    return parts.slice(1).join(' ')
  }
  return ''
}

function attrNames (node, includeHidden) {
  const a = rawAttrs(node)
  const result1 = Object.getOwnPropertyNames(a)
  if (a['class'] === undefined && embeddedClassNames(node)) {
    result1.push('class')
  }
  const result2 = []
  let hasStyle = false
  for (let key of result1) {
    if (key[0] === '$' || key.startsWith('style.')) {
      hasStyle = true
      continue
    }
    if (key[0] === '_' && !includeHidden) {
      continue
    }
    result2.push(key)
  }
  if (hasStyle) {
    result2.push('style')
  }
  result2.sort()
  return result2
}

function attr (node, key) {
  const a = rawAttrs(node)
  if (key === 'style') {
    const val = []
    let s = (a.style || '').trim()
    if (s.endsWith(';')) {  // remove trailining semi if there is one
      s = s.slice(0, -1)
    }
    if (s) {
      val[0] = s
    }
    for (let sk of Object.getOwnPropertyNames(a)) {
      for (let pre of ['$', 'style.']) {
        if (sk.startsWith(pre)) {
          let k = sk.slice(pre.length)
          val.push(k + ': ' + a[sk])
        }
      }
    }
    val.sort() // mostly just for easier testing
    return val.length ? val.join('; ') : undefined
  } else if (key === 'class') {
    let both = Object.getOwnPropertyNames(classesAsKeys(node))
    both.sort()
    if (both.length === 0) {
      return undefined
    } else {
      return both.join(' ')
    }
  } else {
    return a[key]
  }
}

function classesAsKeys (node) {
  const a = rawAttrs(node)
  let s1 = (a['class'] || '').split(' ')
  let s2 = embeddedClassNames(node).split(' ')
  let both = s1.concat(s2)
  let bothObj = {}
  both.forEach(x => {if (x) {bothObj[x] = true}})
  return bothObj
}

function walk (node, func) {
  func(node)
  forEachChild(node, x => walk(x, func))
}

function find (filter, node, func) {
  if (typeof filter === 'string') {
    filter = (x => match(node, filter))
  }
  if (filter(node)) func(node)
  forEachChild(node, x => find(filter, x, func))
}

function match (node, pattern) {
  let parts = pattern.split(' ')
  for (let part of parts) {
    if (part.startsWith('.')) {
      let target = part.slice(1)
      let classes = classesAsKeys(node)
      if (classes[target]) return true
    } else if (part.startsWith('#')) {
      if (attr(node, 'id') === part.slice(1)) return true
    } else {
      if (tagName(node) === part) return true
    }
  }
  return false
}

function expanded (node) {
  if (typeof node === 'string') return node
  const result = [ tagName(node),
                   attrsCopy(node) ]
  forEachChild(node, x => { result.push(expanded(x)) })
  return result
}

function attrsCopy (node) {
  const result = {}
  for (let key of attrNames(node)) {
    result[key] = attr(node, key)
  }
  return result
}

function compacted (node) {
  if (typeof node === 'string') return node
  const result = [ tagName(node) ]
  const attrObj = {}
  for (let key of attrNames(node)) {
    let val = attr(node, key)
    if (key === 'class') {
      result[0] += ' ' + val
    } else if (key === 'style') {
      if (val.indexOf('"') != -1 || val.indexOf("'") != -1) {
        // not safe to split
        attrObj.style = val  
      } else {
        let styles = val.split(';')
        for (let line of styles) {
          let lr = line.split(':')
          if (lr.length != 2) {
            throw Error('having trouble with splitting style value:'+
                        JSON.stringify(val))
          }
          attrObj['$'+lr[0]] = lr[1]
        }
      }
    } else {
      attrObj[key] = val
    }
  }
  if (Object.getOwnPropertyNames(attrObj).length > 0) {
    result.push(attrObj)
  }
  forEachChild(node, x => { result.push(compacted(x)) })
  return result
}

module.exports.children = children
module.exports.forEachChild = forEachChild
module.exports.tagName = tagName
module.exports.attrNames = attrNames
module.exports.attr = attr
module.exports.walk = walk
module.exports.find = find
module.exports.match = match
module.exports.expanded = expanded
module.exports.compacted = compacted

