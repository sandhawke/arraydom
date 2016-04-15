'use strict'

function document (options) {
  const attrs = {}
  if (options.lang) {
    attrs.lang = options.lang
  }
  return ['document',
    {},
    ['processinginstruction', {'name': '!doctype'}, '!DOCTYPE html'],
    ['html', attrs, head(options), body(options)]
  ]
}

function head (options) {
  const out = [
    'head', {},
    ['meta', {'charset': 'utf-8'}],
    ['meta', {'http-equiv': 'X-UA-Compatible', 'content': 'IE=edge'}],
    ['meta', {'name': 'viewport', 'content': 'width=device-width, initial-scale=1'}],
    //['comment', {}, ' The above 3 meta tags *must* come first in the head; any other head content must come *after* these tags ']
  ]

  if (options.description) {
    out.push(['meta', {'name': 'description', 'content': options.description}])
  }
  if (options.author) {
    out.push(['meta', {'name': 'author', 'content': options.author}])
  }
  if (options.iconURL) {
    out.push(['link', {'rel': 'icon', 'href': options.iconURL}])
  }
  // out.push('\n\n    ')
  if (options.title) {
    out.push(['title', {}, options.title])
  // out.push('\n\n    ')
  }

  if (options.cssURLs) {
    for (let cssURL of options.cssURLs) {
      out.push(['link', {'href': cssURL, 'rel': 'stylesheet'}])
    }
    // out.push('\n\n    ')
  }

  if (options.headScriptURLs) {
    for (let url of options.headScriptURLs) {
      out.push(['script', {'src': url, 'type': 'text/javascript'}])
    }
    // out.push('\n\n    ')
  }

  if (options.ie8 !== false) {
    out.push(['comment', {}, ' HTML5 shim and Respond.js for IE8 support of HTML5 elements and media queries '])
    out.push(['comment', {}, '[if lt IE 9]>\n      <script src="https://oss.maxcdn.com/html5shiv/3.7.2/html5shiv.min.js"></script>\n      <script src="https://oss.maxcdn.com/respond/1.4.2/respond.min.js"></script>\n    <![endif]'])
  }
  
  return out
}

function body (options) {
  let attrs = {}
  if (options.bodyAttrs) {
    attrs = options.bodyAttrs
  }

  const out = [
    'body', attrs
  ]

  if (options.page) {
    // out.push(nav(options))
    for (let section of options.page) {
      out.push(section)
    }
  }

  //out.push(footer(options))

  /*
  let urls = [
    'https://code.jquery.com/jquery-1.10.2.min.js',
    'https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/js/bootstrap.min.js'
  ]
  */
  if (options.bodyScriptURLs) {
    for (let url of options.bodyScriptURLs) {
      out.push(['script', {'src': url, 'type': 'text/javascript'}])
    }
    // out.push('\n\n    ')
  }

  return out
}

function nav (options) {
  const items = ['ul nav navbar-nav', {}]
  for (let section of options.sections) {
    items.push(
      ['li', {},
        [
          'a',
          {
            'href': '#' + section[1].id
          },
          section[1]._label || section[1].id
        ]
      ]
    )

    /*  DROPDOWNS look like this.  Do we want them?   Subsections?

              [
                "li dropdown",
                {},
                [
                  "a dropdown-toggle",
                  {
                    "href": "#",
                    "data-toggle": "dropdown",
                    "role": "button",
                    "aria-haspopup": "true",
                    "aria-expanded": "false"
                  },
                  "Dropdown ",
                  [
                    "span caret"
                  ]
                ],
                [
                  "ul dropdown-menu",
                  {},
                  [
                    "li",
                    {},
                    [
                      "a",
                      {
                        "href": "#"
                      },
                      "Action"
                    ]
                  ],
                  [
                    "li",
                    {},
                    [
                      "a",
                      {
                        "href": "#"
                      },
                      "Another action"
                    ]
                  ],
                  [
                    "li",
                    {},
                    [
                      "a",
                      {
                        "href": "#"
                      },
                      "Something else here"
                    ]
                  ],
                  [
                    "li divider",
                    {
                      "role": "separator"
                    }
                  ],
                  [
                    "li dropdown-header",
                    {},
                    "Nav header"
                  ],
                  [
                    "li",
                    {},
                    [
                      "a",
                      {
                        "href": "#"
                      },
                      "Separated link"
                    ]
                  ],
                  [
                    "li",
                    {},
                    [
                      "a",
                      {
                        "href": "#"
                      },
                      "One more separated link"
                    ]
                  ]
                ]
              ]
            ]
          ],
    */
  }

  const out = [
    // element 'nav' ?
    'div navbar navbar-inverse navbar-fixed-top',
    {},
    [
      'div container',
      {},
      [
        'div navbar-header',
        {},
        [
          'button navbar-toggle collapsed',
          {
            'type': 'button',
            'data-toggle': 'collapse',
            'data-target': '#navbar',
            'aria-expanded': 'false',
            'aria-controls': 'navbar'
          },
          [
            'span sr-only',
            {},
            'Toggle navigation'
          ],
          [
            'span icon-bar'
          ],
          [
            'span icon-bar'
          ],
          [
            'span icon-bar'
          ]
        ],
        [
          'a navbar-brand',
          {
            'href': '#'
          },
          options.brand || options.title
        ]
      ],
      [
        'div navbar-collapse collapse',
        {
          'id': 'navbar'
        },
        items
      ]
    ]
  ]
  return out
}

function footer (options) {
  let copyrightElement = '&nbsp;'
  if (options.copyright) {
    copyrightElement = [
      'span copyright',
      {},
      'Copyright ',
      '©',
      ' 2016 ',
      options.copyright
    ]
  }
  return [
    'div',
    {
      'id': 'footerwrap'
    },
    [
      'div container',
      {},
      [
        'div row',
        {},
        [
          'div col-md-12',
          {},
          ' ',
          copyrightElement,
          ' '
        ],
        [
          'comment',
          {},
          ' <div class="col-md-4">\n        <ul class="list-inline social-buttons">\n          <li><a href="#"><i class="fa fa-twitter"></i></a> </li>\n          <li><a href="#"><i class="fa fa-facebook"></i></a> </li>\n          <li><a href="#"><i class="fa fa-google-plus"></i></a> </li>\n          <li><a href="#"><i class="fa fa-linkedin"></i></a> </li>\n        </ul>\n      </div> '
        ]
      ]
    ]
  ]
}

function streamTo (options, stream) {
  stream.write(arraydom.stringify(document(options)))
}

module.exports.generate = document
module.exports.document = document
module.exports.streamTo = streamTo

if (require.main === module) {
  process.stdin.resume()
  process.stdin.setEncoding('utf8')
  readAll(process.stdin, (text) => {
    const options = JSON.parse(text)
    const out = document(options)
    process.stdout.write(JSON.stringify(out, null, 2))
  })
}

function readAll (stream, cb) {
  const buf = []
  stream.on('data', function (chunk) {
    buf.push(chunk)
  })
  stream.on('end', function () {
    cb(buf.join())
  })
}
