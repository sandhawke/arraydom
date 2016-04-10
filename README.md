# arraydom.js

Consider HTML a simple tree of JS arrays — 

Converts back and forth between these two representations:

```html
<html>
  <head>
    <title>Lazydom Example Page</title>
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

```json
[ "html", {},
  [ "head", {},
    [ "title", {}, "Lazydom Example Page" ]
  ],
  ["body", {},
   [ "h1", {}, "Page Title"],
   [ "hr" ],
   [ "p alert", { "style.border": "3px solid blue" }, "Lorem Ipsem!" ],
   [ "img",
     {
       "src": "https://pixabay.com/static/uploads/photo/2015/11/26/17/39/cat-1064225_960_720.jpg",
       "width": 400
     }
   ]
  ]
]
```
