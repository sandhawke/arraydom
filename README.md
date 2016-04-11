## arraydom - An elegant weapon for a more civilized HTML

Consider HTML as a simple tree of JavaScript arrays.   

(This API is not exactly what's currently implemented; it's partly
thinking out loud about how to make the interface better.)


Converts back and forth between these two representations:

```html
<html>
  <head>
    <title>Arraydom Example Page</title>
  </head>
  <body>
    <h1>Page Title</h1>
    <hr/>
    <p class="alert" style="border: 3px solid blue;">Lorem Ipsem!</p>
    <img src="https://pixabay.com/static/uploads/photo/2015/11/26/17/39/cat-1064225_960_720.jpg" width="400" />
  </body>
</html>
```

and

```javascript
['html',
  ['head',
    ['title', 'Arraydom Example Page' ]
  ],
  ['body',
   ['h1', 'Page Title'],
   ['hr'],
   ['p alert', { 'style.border': '3px solid blue' }, 'Lorem Ipsem!' ],
   ['img',
     {
       src: 'https://pixabay.com/static/uploads/photo/2015/11/26/17/39/cat-1064225_960_720.jpg',
       width: 400
     }
   ]
  ]
]
```

## conventions

Each node is an array:

* The first item is a string like `'div container'`. 
* The second item may be an attributes object.  If there are no attributes, it may be omited.
* The remaining items are either strings, numbers, or other nodes.

So `<div a="b">foo</div>"` is `['div', {a:'b'}, 'foo']`

Because there are several different ways to write things (like putting classes in the first item string or in the attributes object), it's best to treat nodes as raw structures when creating them, but read them with functions like `arraydom.tag`, `arraydom.attr`, and `arraydom.forEachChild`.  (TODO)

### pseudo-attributes

All attributes with names like `style.foo` (or `$foo` TODO) are merged
together to form the **style** attributes.

Attributes with names starting with `_` are omitted during conversion
to HTML. (TODO)

The special attribute `_inherit` makes it easy to factor out bits that
are repeated in lots of element's attributes.  Sometimes this is
better than style sheets.  (TODO)

### pseudo-elements

`*wrapper` for when your content isn't a proper tree.   (only implemented at the top-level currently.   maybe later we'll allow it inside the tree, as kind of a disappearing-div)  (TODO - current called `document`)

`*comment` to represent HTML comments &amp;!-- ... -->

`*pi` to represent processing instructions like ?xml and !DOCTYPE

## Functions

`arraydom.toHTML(node)`

`arraydom.toIndentedHTML(node)` tries to cleverly figure out a nice indenting, where that wont mess up the content.   Basically, if an element contains any text children, it's assumed that spacing matters.  (TODO: currently uses options to toHTML)

`arraydom.fromHTML(string)`

`arraydom.fromMarkdown(string)`

`arraydom.fromDOM(element)` (TODO)

`arraydom.toDOM(node)` and then you'll have to attach the result   (TODO)

`arraydom.attr(node, attrName)` returns the value of the attribute from this node.  Looks in node[1], but also in node[0] for class and id, and follows the _inherit chain (TODO)

`arraydom.children(node)` (TODO)

`arraydom.forEachChild(node, cb)` slightly more efficient than children()
`arraydom.walk(node, func)` calls func on each node in the tree rooted at `node`  (TODO)

`arraydom.find(keywords, node, func)` like walk, but filtered by keywords, which are the words in a node[0] string.  That is: `arraydom.find('.foo .bar', tree, f)` will call f on every node which has class `foo` or class `bar`.   If you want *and* instead of *or*, run find on one of the keywords and check for the others inside f.  (TODO)



