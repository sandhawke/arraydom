'use strict'

const domdriver = require('../domdriver')
const EventEmitter = require('EventEmitter3')

const data = { now: 'starting' }

const db      = new EventEmitter()

setInterval( () => {
  db.emit('changed', data)
}, 500)

