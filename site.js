'use strict'
const fs = require('fs')
const page = require('./page')
const toHTML = require('./toHTML')

function generate (options) {
  const dir = options.siteDirectory || './public_html'

  console.log('options', JSON.stringify(options))
  for (let p of options.site.slice(2)) {
    console.log('page', JSON.stringify(p))
    options.page = p.slice(2)
    options.title = p[1]._title || p[1].id 
    let pagedom = page.generate(options)
    console.log('pagedom', JSON.stringify(pagedom))
    fs.writeFileSync(dir+'/'+p[1].id+'.html', toHTML(pagedom))
  }

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

module.exports.generate = generate

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
