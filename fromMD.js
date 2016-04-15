'use strict'

const commonmark = require('commonmark')

const fromHTML = require('./fromHTML')

function parseDocumentMD (text) {
  const reader = new commonmark.Parser()
  const writer = new commonmark.HtmlRenderer()
  const parsed = reader.parse(text)
  const result = writer.render(parsed)
  return fromHTML.parseDocument(result)
}

module.exports.parseDocumentMD = parseDocumentMD
