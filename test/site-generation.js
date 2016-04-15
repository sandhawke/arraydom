'use strict'

const test = require('tape')
const arraydom = require('..')

test('', t => {
  t.plan(1)
  let options = {
    site: ['*wrapper', {},
           ['*wrapper', {id:'p1'}, ['p', {}, 'Hello, World']],
           ['*wrapper', {id:'p2'}, ['p', {}, 'Hello, World (page 2)']]
          ]
  }
  let generated = arraydom.generateSite(options)
  let expected = ''
  t.equal(expected, generated)
})
