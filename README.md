## arraydom - An elegant weapon for a more civilized HTML

Consider HTML as a simple tree of JavaScript arrays.  Some of us find
this easier and more intuitive than any templating system, including
JSX.

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
   ['title', 'Arraydom Example Page']],
  ['body',
   ['h1', 'Page Title'],
   ['hr'],
   ['p alert', {$border: '3px solid blue'}, 'Lorem Ipsem!'],
   ['img', {src:
     'https://pixabay.com/static/uploads/photo/2015/11/26/17/39/cat-1064225_960_720.jpg',
     width: 400}]]]
```

## conventions

Each node is an array:

* The first item is a string like `'div container'`, containing the element tagname and then optionally values for the class attribute.
* The second item may be an attributes object.  If there are no attributes, it may be omited.
* The remaining items are either strings, numbers, or other nodes.  They are the content of this element.

Examples:

html                                  | arraydom
--------------------------------------|-----------------------
`<div>foo</div>`                      | `['div', 'foo']`
`<div a="b"></div>`                   | `['div', {a:'b'}]`
`<div a="b">foo</div>`                | `['div', {a:'b'}, 'foo']`
`<div class="nav">foo</div>`          | `['div nav', 'foo']`
`<p>Hello, <i>World!</i></p>`         | `['p', 'Hello, ', ['i', 'World!']]`
`<img style="float:left" src="icon">` | `['img', {$float:'left', src:'icon'}]`

Because there are several different ways to write things (like putting classes in the first item string or in the attributes object), it's best to treat nodes as raw structures when creating them, but read them with functions like `arraydom.tag`, `arraydom.attr`, and `arraydom.forEachChild`.  

### pseudo-attributes

All attributes with names like `$foo` are merged together to form the
HTML `style` attribute of the element.

Attributes with names starting with `_` are omitted during conversion
to HTML.


#### root pseudo-attributes

`_title` the window title

`_cssURLs` array of URLs of CSS stylesheets to link to

`_scriptURLs` array of URLs of scripts to include.   The `async` property will cause the script to be included at the end of the body to better support IE<11.

### pseudo-elements

`*wrapper` for when your content isn't a tree.   This way you can call a function in the middle of the content list and it's okay if it returns zero, one, or many elements -- it just has to wrap it in this if it returns anything other than one element.   (TODO: make this work at every level, not just the root, as kind of a disappearing-div)  (TODO: rename from `document`)   Must not have any real attributes since there's no HTML element to attach them too (although pseudo attributes can be okay in some situatiuons).

`*comment` to represent HTML comments &lt;!-- ... --> .   Content isn't restricted, so you can use this to comment out an arbitrary subtree.

`*pi` to represent processing instructions like ?xml and !DOCTYPE (TODO: rename from `processinginstruction`).


## Format Conversion Functions

`arraydom.toHTML(node)`

`arraydom.toIndentedHTML(node)` tries to cleverly figure out a nice indenting, where that wont mess up the content.   Basically, if an element contains any text children, it's assumed that spacing matters.  (TODO: currently uses options to toHTML)

`arraydom.toHTMLDocument(node)` like toIndentedHTML, but provides standard boilerplate, so you can just provide the body content and the doctype, html, head, and body elements get generated.   Various configuration options are available as pseudo-attributes on the node.    See root pseudo-attributes.  (TODO)

`arraydom.fromHTML(string)`

`arraydom.fromMarkdown(string)`

`arraydom.fromDOM(element)` (TODO)   In browser.

`arraydom.toDOM(node)` and then you'll have to attach the result   In browser. (TODO)

### Access Functions

`arraydom.attrNames(node)` returns the names of each attribute of this node 

`arraydom.attr(node, attrName)` returns the value of the attribute from this node.  Looks in node[1], but also in node[0] for class and id, and follows the _inherit chain 

`arraydom.children(node)` 

`arraydom.forEachChild(node, cb)` slightly more efficient than children()

`arraydom.walk(node, func)` calls func on each node in the tree rooted at `node`  

`arraydom.match(node, pattern)` checks the node against a css-like selector.  Returns true if the node has a tagname, class, or id which matches any term in the pattern, where class is prefixed by a dot and id by a hash.

`arraydom.find(filter, node, func)` like walk, but only calls the function if the filter matches.  filter can be a boolean function or a string.  If it's a string, it's used as a pattern for calling `match`.

### Structure Conversion Functions

`arraydom.expanded(node)` returns a deep copy of the tree rooted at `node`, modified to be regular and HTML-like.   That is, no classes in node[0], no `$` attributes, no `+` elements (except possibly at the root), no omitted attr objects, no _inherits, etc.

`arraydom.compacted(node) returns a deep copy of the tree rooted at `node`, modified to be as nice as possible, the opposite of `expanded`.

## Command line (if installed with -g)

(TODO: current two different scripts)

```bash
$ arraydom < some-input-file
```
or
```bash
$ arraydom some-input-file
```

Sniffs the input to see if it's json, html, or markdown.   converts to either json or html.

```bash
$ arraydom -j some-input-file
```

Converts to JavaScript instead of JSON, with a much more compact
indenting conention than JSON.  Good for when you want to convert some
existing HTML into something you'll run in your code.  
