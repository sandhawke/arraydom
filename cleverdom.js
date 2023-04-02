'use strict'
/*

  
dd.live(q, func, attrs)

    calls func(results, attrs)
    to return the tree, with possibly-modified attrs
    every time q.results changes

    basically q.on('change', (results) {
        tree = func(results, attrs)
        dd.touch
    })


 */

function cleverDOMDriver () {

}

module.exports.cleverDOMDriver = cleverDOMDriver
