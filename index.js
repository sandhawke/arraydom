'use strict'

const toHTML = require('./toHTML')
const toDOM = require('./toDOM')
const fromHTML = require('./fromHTML')
const fromMD = require('./fromMD')
const page = require('./page')
const site = require('./site')
const struct = require('./struct')

const debug = require('debug')('arraydom')

module.exports.stringify = toHTML
module.exports.toHTML = toHTML
module.exports.createDOMDriver = toDOM.createDOMDriver

module.exports.parseDocument = fromHTML.parseDocument
module.exports.parseElement = fromHTML.parseElement

module.exports.parseDocumentMD = fromMD.parseDocumentMD

module.exports.generatePage = page.generate
module.exports.generateSite = site.generate

module.exports.compacted = struct.compacted
module.exports.children = struct.children

