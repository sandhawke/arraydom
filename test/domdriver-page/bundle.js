(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

const struct = require('../arraydom/struct.js')
const debug = require('debug')('arraydom-diff')

const tagName   = struct.tagName
const attr      = struct.attr
const attrNames = struct.attrNames

//window.jsdebug = require('debug')
//window.jsdebug.enable('*')

function scalar (x) {
  return (typeof x === 'string' || typeof x === 'number')
}

function patch (t0, steps, doc) {
  if (!doc) doc = document // easy override for 'document' for testing
  
  // refnum[3] is the node with refnum 3, ie at pre-order index 3
  const refnum = buildRefnumArray(t0, steps)

  // while debugging in browser
  if (typeof window !== 'undefined') window.refnum = refnum

  function refOrNew (expr) {
    if (expr.refnum) {
      // allow diffs to have nodes moved around arbitrarily, even
      // though our diff() never does that.  We can't just pass the
      // number here, because we allow numbers (which are later turned
      // into strings) in arraydom trees.
      return refnum[expr]
    }
    return construct(expr, doc)
  }
  
  for (let step of steps) {
    //debug('step', step)
    if (step.method === 'remove') {
      refnum[step.object].remove()
    } else if (step.method === 'appendChild') {
      refnum[step.parent].appendChild(refOrNew(step.child))
    } else if (step.method === 'insertBefore') {
      refnum[step.sibling].parentNode.insertBefore(refOrNew(step.inserted),
                                                   refnum[step.sibling])
    } else if (step.method === 'setAttribute') {
      set(refnum[step.object], step.attribute, step.value)
    } else if (step.method === 'deleteAttribute') {
      unset(refnum[step.object], step.attribute)
    } else throw Error('unknown patch method')
  }
}

// return doc.createElement(...) with the whole tree + attrs
function construct (a, doc) {
  if (typeof a === 'string') return doc.createTextNode(a)
  if (typeof a === 'number') return doc.createTextNode('' + a)
  const e = doc.createElement(tagName(a))
  for (let name of attrNames(a, true, true)) {
    set(e, name, attr(a, name))
  }
  for (let child of a.slice(2)) {
    e.appendChild(construct(child, doc))
  }
  return e
}
//window.construct = construct

/*
  This is interesting because we smoosh .style and .dataset into the key

  set(n, 'a', val)  =>   n.setAttribute('a', val)
  set(n, '$a', val) =>   n.style.a = val
  set(n, '$a-b', val) =>   n.style.aB = val
  set(n. '_a', val) =>   n.dataset.a = val 
*/
function set (node, key, val) {
  if (key[0] === '_') {
    node.dataset[key.slice(1)] = val
  } else if (key[0] === '$') {
    let stylekey = key.slice(1).replace(/-[^-]/g, x => x[1].toUpperCase())
    node.style[stylekey] = val
  } else {
    // which of these is better?   setAttribute doesn't work when
    // val is a function.
    // xxx node.setAttribute(key, val)
    node[key] = val
  }
}
function unset (node, key, val) {
  if (key[0] === '_') {
    delete node.dataset[key.slice(1)]
  } else if (key[0] === '$') {
    let stylekey = key.slice(1).replace(/-[^-]/g, x => x[1].toUpperCase())
    delete node.style[stylekey]
  } else {
    node.deleteAttribute(key)
  }
}


/*
  Return a sorted array of the refnums used anywhere in the given steps

  Actually we don't need this, since we're no longer using a sparse
  array, but we might switch back to sparse array, so I'm keeping it
  here for now.
*/
function buildRefList (steps) {
  const refs = new Set()
  for (let step of steps) {
    for (let prop of ['object', 'parent', 'child', 'sibling', 'inserted']) {
      if (typeof step[prop] === 'number') refs.add(step[prop])
    }
  }
  const refsArray = Array.from(refs)
  refsArray.sort()
  return refsArray
}

/* 
   Return an array mapping refnum ==> nodes in t0 
*/
function buildRefnumArray (t0) {
  let result = []

  function visit (n) {
    // debug('visiting', n)
    result.push(n)
    let child = n.firstChild
    while (child) {
      visit(child)
      child = child.nextSibling
    }
  }

  visit(t0)
  return result
}


/*
  Compute a set of steps one would have to apply to t0 to get t1
*/
function diff (t0, t1) {
  const steps = []
  let refnum

  function remove (x) {
    //debug('removed called with', x)
    steps.push({ method: 'remove', object: x })
    //debug('PUSHED: ', steps.slice(-1))
  }
  function appendChild (x, child) {
    steps.push({ method: 'appendChild', parent:x, child: child })
  }
  function insertBefore (i, s) {
    steps.push({ method: 'insertBefore', inserted: i, sibling: s })
  }
  function setAttribute (x, k, v) {
    steps.push({ method: 'setAttribute', object:x, attribute:k, value: v})
  }
  function deleteAttribute (x, k) {
    steps.push({ method: 'deleteAttribute', object:x, attribute:k})
  }
  
  function alignable (a, b) {
    if (scalar(a) && scalar(b)) {
      // the DOM supports textContent, but I think it'll slow our
      // algorithm down here, if we don't tree text basically as
      // anchors.  I think apps will be inserting and deleting
      // elements, not textnodes.
      return a === b
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      // we can't change tagNames
      // http://stackoverflow.com/questions/3435871/jquery-how-to-change-tag-name
      if (tagName(a) !== tagName(b)) return false
      // and it seems like a bad idea to change ids.  But forbidding
      // the changing of ids, I think the algorithm will perform a
      // lot better
      if (attr(a, 'id') !== attr(b, 'id')) return false
      // ... anything else?
      return true
    }
    return false
    // debug('cant tell if alignable', a, b)
    // throw Error()
  }

  // Return the index (or -1) of the next sibling in b (>= 
  // minIndex) which is alignable with the given item
  function nextAlignable(element, b, minIndex) {
    for (let jj = minIndex; jj < b.length; jj++) {
      const aligns = alignable(element, b[jj])
      //debug('alignable? ', element, b[jj], aligns)
      if (aligns) return jj
    }
    return -1
  }

  function align (a, b) {
    //debug('align', a, b)
    if (!alignable(a,b)) throw Error()  // should never be here
    if (scalar(a)) return
    const refnumSaved = refnum
    adjustAttributes(refnumSaved, a, b)
    let i = 2 // offset of first child ASSUMES attrs
    let j = 2 // offset of first child ASSUMES attrs
    while (i < a.length) {
      //debug('starting align loop', i, a[i], j, b[j])
      let child = a[i]
      refnum++
      let nextj = nextAlignable(child, b, j)
      if (nextj === j) {
        //debug('alignable at', i, j)
        align(a[i], b[j])
        i++
        j++
      } else if (nextj === -1) {
        //debug('align delete child at', i, refnum)
        // child cannot align with anything in the rest of b, so
        // delete it -- it's of no use to us, sorry.  We don't look
        // for where else in the tree it might be useful.
        //debug('calling remove with', refnum)
        remove(refnum)
        i++
      } else {
        // child CAN align with some later sibling, so create the children 
        // for the interving nodes
        while (j < nextj) {
          //debug('align insertBefore ', b[j], refnum)
          insertBefore(deepCopy(b[j]), refnum)
          j++
        }
        // undo that refnum increment, since we didn't actually move this loop
        refnum--
      }
    }
    while (j < b.length) {
      //debug('align append children, because ', j, b.length)
      appendChild(refnumSaved, deepCopy(b[j]))
      j++
    }
  }

  function adjustAttributes (refnum, a, b) {
    const old = new Set()
    for (let name of attrNames(a, true, true)) {
      old.add(name)
    }
    for (let name of attrNames(b, true, true)) {
      let val = attr(b, name)
      if (val === null) {
        deleteAttribute(refnum, name)
      } else {
        if (a[name] !== val) {
          setAttribute(refnum, name, val)
        }
      }
      old.delete(name)
    }
    for (let name of old) {
      deleteAttribute(refnum, name)
    }
  }

  if (!alignable(t0, t1)) {
    // or maybe we should use node.replaceChild() for this?
    // otherwise muck around...??
    throw ('Not allowed to change root tagName or id ')
  }

  refnum = 0
  align(t0, t1)
  //debug('aligned', t0, t1)
  return steps
}

function deepCopy (a) {
  if (scalar(a)) {
    return a
  }
  if (Array.isArray(a)) {
    const result = []
    for (let aa of a) {
      result.push(deepCopy(aa))
    }
    return result
  }
  if (typeof (a) === 'object') {
    return Object.assign({}, a)
  }
  console.error('unexpected object', a)
  throw Error('no other types implemented')
}

module.exports.construct = construct
module.exports.patch = patch
module.exports.diff = diff
module.exports.deepCopy = deepCopy
module.exports.buildRefnumArray = buildRefnumArray

},{"../arraydom/struct.js":7,"debug":2}],2:[function(require,module,exports){

/**
 * This is the web browser implementation of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = require('./debug');
exports.log = log;
exports.formatArgs = formatArgs;
exports.save = save;
exports.load = load;
exports.useColors = useColors;
exports.storage = 'undefined' != typeof chrome
               && 'undefined' != typeof chrome.storage
                  ? chrome.storage.local
                  : localstorage();

/**
 * Colors.
 */

exports.colors = [
  'lightseagreen',
  'forestgreen',
  'goldenrod',
  'dodgerblue',
  'darkorchid',
  'crimson'
];

/**
 * Currently only WebKit-based Web Inspectors, Firefox >= v31,
 * and the Firebug extension (any Firefox version) are known
 * to support "%c" CSS customizations.
 *
 * TODO: add a `localStorage` variable to explicitly enable/disable colors
 */

function useColors() {
  // is webkit? http://stackoverflow.com/a/16459606/376773
  return ('WebkitAppearance' in document.documentElement.style) ||
    // is firebug? http://stackoverflow.com/a/398120/376773
    (window.console && (console.firebug || (console.exception && console.table))) ||
    // is firefox >= v31?
    // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
    (navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/) && parseInt(RegExp.$1, 10) >= 31);
}

/**
 * Map %j to `JSON.stringify()`, since no Web Inspectors do that by default.
 */

exports.formatters.j = function(v) {
  return JSON.stringify(v);
};


/**
 * Colorize log arguments if enabled.
 *
 * @api public
 */

function formatArgs() {
  var args = arguments;
  var useColors = this.useColors;

  args[0] = (useColors ? '%c' : '')
    + this.namespace
    + (useColors ? ' %c' : ' ')
    + args[0]
    + (useColors ? '%c ' : ' ')
    + '+' + exports.humanize(this.diff);

  if (!useColors) return args;

  var c = 'color: ' + this.color;
  args = [args[0], c, 'color: inherit'].concat(Array.prototype.slice.call(args, 1));

  // the final "%c" is somewhat tricky, because there could be other
  // arguments passed either before or after the %c, so we need to
  // figure out the correct index to insert the CSS into
  var index = 0;
  var lastC = 0;
  args[0].replace(/%[a-z%]/g, function(match) {
    if ('%%' === match) return;
    index++;
    if ('%c' === match) {
      // we only are interested in the *last* %c
      // (the user may have provided their own)
      lastC = index;
    }
  });

  args.splice(lastC, 0, c);
  return args;
}

/**
 * Invokes `console.log()` when available.
 * No-op when `console.log` is not a "function".
 *
 * @api public
 */

function log() {
  // this hackery is required for IE8/9, where
  // the `console.log` function doesn't have 'apply'
  return 'object' === typeof console
    && console.log
    && Function.prototype.apply.call(console.log, console, arguments);
}

/**
 * Save `namespaces`.
 *
 * @param {String} namespaces
 * @api private
 */

function save(namespaces) {
  try {
    if (null == namespaces) {
      exports.storage.removeItem('debug');
    } else {
      exports.storage.debug = namespaces;
    }
  } catch(e) {}
}

/**
 * Load `namespaces`.
 *
 * @return {String} returns the previously persisted debug modes
 * @api private
 */

function load() {
  var r;
  try {
    r = exports.storage.debug;
  } catch(e) {}
  return r;
}

/**
 * Enable namespaces listed in `localStorage.debug` initially.
 */

exports.enable(load());

/**
 * Localstorage attempts to return the localstorage.
 *
 * This is necessary because safari throws
 * when a user disables cookies/localstorage
 * and you attempt to access it.
 *
 * @return {LocalStorage}
 * @api private
 */

function localstorage(){
  try {
    return window.localStorage;
  } catch (e) {}
}

},{"./debug":3}],3:[function(require,module,exports){

/**
 * This is the common logic for both the Node.js and web browser
 * implementations of `debug()`.
 *
 * Expose `debug()` as the module.
 */

exports = module.exports = debug;
exports.coerce = coerce;
exports.disable = disable;
exports.enable = enable;
exports.enabled = enabled;
exports.humanize = require('ms');

/**
 * The currently active debug mode names, and names to skip.
 */

exports.names = [];
exports.skips = [];

/**
 * Map of special "%n" handling functions, for the debug "format" argument.
 *
 * Valid key names are a single, lowercased letter, i.e. "n".
 */

exports.formatters = {};

/**
 * Previously assigned color.
 */

var prevColor = 0;

/**
 * Previous log timestamp.
 */

var prevTime;

/**
 * Select a color.
 *
 * @return {Number}
 * @api private
 */

function selectColor() {
  return exports.colors[prevColor++ % exports.colors.length];
}

/**
 * Create a debugger with the given `namespace`.
 *
 * @param {String} namespace
 * @return {Function}
 * @api public
 */

function debug(namespace) {

  // define the `disabled` version
  function disabled() {
  }
  disabled.enabled = false;

  // define the `enabled` version
  function enabled() {

    var self = enabled;

    // set `diff` timestamp
    var curr = +new Date();
    var ms = curr - (prevTime || curr);
    self.diff = ms;
    self.prev = prevTime;
    self.curr = curr;
    prevTime = curr;

    // add the `color` if not set
    if (null == self.useColors) self.useColors = exports.useColors();
    if (null == self.color && self.useColors) self.color = selectColor();

    var args = Array.prototype.slice.call(arguments);

    args[0] = exports.coerce(args[0]);

    if ('string' !== typeof args[0]) {
      // anything else let's inspect with %o
      args = ['%o'].concat(args);
    }

    // apply any `formatters` transformations
    var index = 0;
    args[0] = args[0].replace(/%([a-z%])/g, function(match, format) {
      // if we encounter an escaped % then don't increase the array index
      if (match === '%%') return match;
      index++;
      var formatter = exports.formatters[format];
      if ('function' === typeof formatter) {
        var val = args[index];
        match = formatter.call(self, val);

        // now we need to remove `args[index]` since it's inlined in the `format`
        args.splice(index, 1);
        index--;
      }
      return match;
    });

    if ('function' === typeof exports.formatArgs) {
      args = exports.formatArgs.apply(self, args);
    }
    var logFn = enabled.log || exports.log || console.log.bind(console);
    logFn.apply(self, args);
  }
  enabled.enabled = true;

  var fn = exports.enabled(namespace) ? enabled : disabled;

  fn.namespace = namespace;

  return fn;
}

/**
 * Enables a debug mode by namespaces. This can include modes
 * separated by a colon and wildcards.
 *
 * @param {String} namespaces
 * @api public
 */

function enable(namespaces) {
  exports.save(namespaces);

  var split = (namespaces || '').split(/[\s,]+/);
  var len = split.length;

  for (var i = 0; i < len; i++) {
    if (!split[i]) continue; // ignore empty strings
    namespaces = split[i].replace(/\*/g, '.*?');
    if (namespaces[0] === '-') {
      exports.skips.push(new RegExp('^' + namespaces.substr(1) + '$'));
    } else {
      exports.names.push(new RegExp('^' + namespaces + '$'));
    }
  }
}

/**
 * Disable debug output.
 *
 * @api public
 */

function disable() {
  exports.enable('');
}

/**
 * Returns true if the given mode name is enabled, false otherwise.
 *
 * @param {String} name
 * @return {Boolean}
 * @api public
 */

function enabled(name) {
  var i, len;
  for (i = 0, len = exports.skips.length; i < len; i++) {
    if (exports.skips[i].test(name)) {
      return false;
    }
  }
  for (i = 0, len = exports.names.length; i < len; i++) {
    if (exports.names[i].test(name)) {
      return true;
    }
  }
  return false;
}

/**
 * Coerce `val`.
 *
 * @param {Mixed} val
 * @return {Mixed}
 * @api private
 */

function coerce(val) {
  if (val instanceof Error) return val.stack || val.message;
  return val;
}

},{"ms":4}],4:[function(require,module,exports){
/**
 * Helpers.
 */

var s = 1000;
var m = s * 60;
var h = m * 60;
var d = h * 24;
var y = d * 365.25;

/**
 * Parse or format the given `val`.
 *
 * Options:
 *
 *  - `long` verbose formatting [false]
 *
 * @param {String|Number} val
 * @param {Object} options
 * @return {String|Number}
 * @api public
 */

module.exports = function(val, options){
  options = options || {};
  if ('string' == typeof val) return parse(val);
  return options.long
    ? long(val)
    : short(val);
};

/**
 * Parse the given `str` and return milliseconds.
 *
 * @param {String} str
 * @return {Number}
 * @api private
 */

function parse(str) {
  str = '' + str;
  if (str.length > 10000) return;
  var match = /^((?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|years?|yrs?|y)?$/i.exec(str);
  if (!match) return;
  var n = parseFloat(match[1]);
  var type = (match[2] || 'ms').toLowerCase();
  switch (type) {
    case 'years':
    case 'year':
    case 'yrs':
    case 'yr':
    case 'y':
      return n * y;
    case 'days':
    case 'day':
    case 'd':
      return n * d;
    case 'hours':
    case 'hour':
    case 'hrs':
    case 'hr':
    case 'h':
      return n * h;
    case 'minutes':
    case 'minute':
    case 'mins':
    case 'min':
    case 'm':
      return n * m;
    case 'seconds':
    case 'second':
    case 'secs':
    case 'sec':
    case 's':
      return n * s;
    case 'milliseconds':
    case 'millisecond':
    case 'msecs':
    case 'msec':
    case 'ms':
      return n;
  }
}

/**
 * Short format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function short(ms) {
  if (ms >= d) return Math.round(ms / d) + 'd';
  if (ms >= h) return Math.round(ms / h) + 'h';
  if (ms >= m) return Math.round(ms / m) + 'm';
  if (ms >= s) return Math.round(ms / s) + 's';
  return ms + 'ms';
}

/**
 * Long format for `ms`.
 *
 * @param {Number} ms
 * @return {String}
 * @api private
 */

function long(ms) {
  return plural(ms, d, 'day')
    || plural(ms, h, 'hour')
    || plural(ms, m, 'minute')
    || plural(ms, s, 'second')
    || ms + ' ms';
}

/**
 * Pluralization helper.
 */

function plural(ms, n, name) {
  if (ms < n) return;
  if (ms < n * 1.5) return Math.floor(ms / n) + ' ' + name;
  return Math.ceil(ms / n) + ' ' + name + 's';
}

},{}],5:[function(require,module,exports){
'use strict'

const diff = require('arraydom-diff')

/*
  [[ getting rid of dd.on -- instead use onclick, etc, and
  makeSafe/makeUnsafe if you can't pass functions. ]]

  Given an empty DOM element (or DOM element id), and an arraydom
  tree, make the tree contents appear as the child of the element.

  Whenever the tree changes, update the DOM automatically.

  This is magic in several ways:

  1.  You just operate on a normal, simple JavaScript tree of arrays,
  and we check periodically to see how it's changed and make a
  corresponding change to the DOM.  You can tell us when the tree or
  its underlying data may have changed by calling .touch() or tell us
  to check every N milliseconds by passing the option { poll: N }

  2.  No matter how often you change the tree, call touch, or tell us
  to poll, we actually only do it when the DOM needs to be displayed.
  (Right now this just uses the refresh rate, which doesn't tell us if
  we're scolled off-screen.)

  3.  If you have functions in the tree where you would normally put a
  tagName, we evaluate it for you (with its children provided as
  arguments).  Its output will be taken as a new tree to use in its
  place for this run-through.  Its output can contain functions as
  well, of course, which are also evaluated.  

  4.  If any of the function argument has an .on method, we try
  .on('change', ...) as setting the touch flag, so that the function
  is re-evaluated.  Right now, these functions are re-evaluated any
  time the tree is checked, so polling / touching applies to both the
  tree and the arguments to these functions.  If the functions are not
  pure (ie, use inputs other than their argfuments), or the argument
  don't honor on('change'), then you need to call .touch or turn on
  polling.

  Call dd.stop() if you want this to stop.  If you pass it a value, it
  becomes the final value for the tree.  Event handlers in that tree
  will still keep running.

*/

function scalar (x) {
  return (typeof x === 'string' || typeof x === 'number')
}

function create(parent, tree, options) {
  options = options || {}
  if (typeof parent === 'string') {
    if (parent.startsWith('#')) parent = parent.slice(1)
    parent = document.getElementById(parent)
  }

  let lastEvalTime = 0
  let touched = true
  function touch () {
    touched = true
  }

  let treeCopy
  let elem
  function reset (t) {
    treeCopy = evalFunctions(t, touch)
    elem = diff.construct(treeCopy, document)
    while (parent.firstChild) parent.removeChild(parent.firstChild)
    parent.appendChild(elem)
  }
  reset(tree)

  let stopped = false
  function stop (finalTree) {
    stopped = true
    if (finalTree) reset(finalTree)
  }
  function schedule (callback) {
    if (stopped) return
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(callback)
    } else {
      setTimeout(callback, 30)
    }
  }
  
  function paint (timestamp) {
    const elapsed = timestamp - lastEvalTime
    if (touched || (options.poll && elapsed >= options.poll)) {
      lastEvalTime = timestamp
      const evaldTree = evalFunctions(tree, touch)
      // console.log('evaldTree is', evaldTree)
      const delta = diff.diff(treeCopy, evaldTree)
      // console.log('delta is', delta)
      treeCopy = evaldTree
      diff.patch(elem, delta, document)
      touched = false
    }
    schedule(paint)
  }

  /*
  function live (db, func, attrs ) {
    const t = ['div', attrs]
    function change (newValue) {
      t.splice(2)
      const out = func(newValue, attrs)
      if (out) {
        t.push(out)
        // console.log('t = ', JSON.stringify(t))
        dd.touch
      } else {
        throw Error('domdriver.live function returned falsy')
      }
    }
    db.on('change', change)
    change(db.values())
    return t
  }
  */
         
  schedule(paint)
  const dd = {}
  //dd.live = live
  dd.touch = touch
  dd.stop = stop
  return dd
}

// we end up evaling more than necessary -- when any change to any
// data happens, trigger a re-eval of the whole tree.   But it's simple
// and probably good enough.
function evalFunctions (a, onChange) {
  if (!onChange) onChange = () => {}
  if (scalar(a)) {
    return a
  }
  if (Array.isArray(a)) {
    if (typeof a[0] === 'function') {
      const args = a.slice(1)
      for (let arg of args) {
        // In theory we could have the onChange function signal it's
        // only this function that needs to be re-run, not the whole
        // tree.  That would be worthwhile if some data changes
        // frequently with a cheap function and other data changes
        // slowly with an expensive function.
        if (typeof arg.on === 'function') {
          arg.on('change', onChange)
        }
        if (typeof arg.onchange === 'function') {
          arg.onchange(onChange)
        }
      }
      const output = a[0].apply(null, args)
      // console.log('func returned', output)
      return evalFunctions(output, onChange)
    } else {
      const result = []
      for (let aa of a) {
        result.push(evalFunctions(aa, onChange))
      }
      return result
    }
  }
  if (typeof (a) === 'object') {
    return Object.assign({}, a)
  }
  console.error('unexpected object', a)
  throw Error('no other types implemented')
}

// for testing
module.exports.evalFunctions = evalFunctions

// for real
module.exports.create = create

},{"arraydom-diff":1}],6:[function(require,module,exports){
'use strict';

var has = Object.prototype.hasOwnProperty;

//
// We store our EE objects in a plain object whose properties are event names.
// If `Object.create(null)` is not supported we prefix the event names with a
// `~` to make sure that the built-in object properties are not overridden or
// used as an attack vector.
// We also assume that `Object.create(null)` is available when the event name
// is an ES6 Symbol.
//
var prefix = typeof Object.create !== 'function' ? '~' : false;

/**
 * Representation of a single EventEmitter function.
 *
 * @param {Function} fn Event handler to be called.
 * @param {Mixed} context Context for function execution.
 * @param {Boolean} [once=false] Only emit once
 * @api private
 */
function EE(fn, context, once) {
  this.fn = fn;
  this.context = context;
  this.once = once || false;
}

/**
 * Minimal EventEmitter interface that is molded against the Node.js
 * EventEmitter interface.
 *
 * @constructor
 * @api public
 */
function EventEmitter() { /* Nothing to set */ }

/**
 * Hold the assigned EventEmitters by name.
 *
 * @type {Object}
 * @private
 */
EventEmitter.prototype._events = undefined;

/**
 * Return an array listing the events for which the emitter has registered
 * listeners.
 *
 * @returns {Array}
 * @api public
 */
EventEmitter.prototype.eventNames = function eventNames() {
  var events = this._events
    , names = []
    , name;

  if (!events) return names;

  for (name in events) {
    if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
  }

  if (Object.getOwnPropertySymbols) {
    return names.concat(Object.getOwnPropertySymbols(events));
  }

  return names;
};

/**
 * Return a list of assigned event listeners.
 *
 * @param {String} event The events that should be listed.
 * @param {Boolean} exists We only need to know if there are listeners.
 * @returns {Array|Boolean}
 * @api public
 */
EventEmitter.prototype.listeners = function listeners(event, exists) {
  var evt = prefix ? prefix + event : event
    , available = this._events && this._events[evt];

  if (exists) return !!available;
  if (!available) return [];
  if (available.fn) return [available.fn];

  for (var i = 0, l = available.length, ee = new Array(l); i < l; i++) {
    ee[i] = available[i].fn;
  }

  return ee;
};

/**
 * Emit an event to all registered event listeners.
 *
 * @param {String} event The name of the event.
 * @returns {Boolean} Indication if we've emitted an event.
 * @api public
 */
EventEmitter.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return false;

  var listeners = this._events[evt]
    , len = arguments.length
    , args
    , i;

  if ('function' === typeof listeners.fn) {
    if (listeners.once) this.removeListener(event, listeners.fn, undefined, true);

    switch (len) {
      case 1: return listeners.fn.call(listeners.context), true;
      case 2: return listeners.fn.call(listeners.context, a1), true;
      case 3: return listeners.fn.call(listeners.context, a1, a2), true;
      case 4: return listeners.fn.call(listeners.context, a1, a2, a3), true;
      case 5: return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
      case 6: return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
    }

    for (i = 1, args = new Array(len -1); i < len; i++) {
      args[i - 1] = arguments[i];
    }

    listeners.fn.apply(listeners.context, args);
  } else {
    var length = listeners.length
      , j;

    for (i = 0; i < length; i++) {
      if (listeners[i].once) this.removeListener(event, listeners[i].fn, undefined, true);

      switch (len) {
        case 1: listeners[i].fn.call(listeners[i].context); break;
        case 2: listeners[i].fn.call(listeners[i].context, a1); break;
        case 3: listeners[i].fn.call(listeners[i].context, a1, a2); break;
        default:
          if (!args) for (j = 1, args = new Array(len -1); j < len; j++) {
            args[j - 1] = arguments[j];
          }

          listeners[i].fn.apply(listeners[i].context, args);
      }
    }
  }

  return true;
};

/**
 * Register a new EventListener for the given event.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.on = function on(event, fn, context) {
  var listener = new EE(fn, context || this)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Add an EventListener that's only called once.
 *
 * @param {String} event Name of the event.
 * @param {Function} fn Callback function.
 * @param {Mixed} [context=this] The context of the function.
 * @api public
 */
EventEmitter.prototype.once = function once(event, fn, context) {
  var listener = new EE(fn, context || this, true)
    , evt = prefix ? prefix + event : event;

  if (!this._events) this._events = prefix ? {} : Object.create(null);
  if (!this._events[evt]) this._events[evt] = listener;
  else {
    if (!this._events[evt].fn) this._events[evt].push(listener);
    else this._events[evt] = [
      this._events[evt], listener
    ];
  }

  return this;
};

/**
 * Remove event listeners.
 *
 * @param {String} event The event we want to remove.
 * @param {Function} fn The listener that we need to find.
 * @param {Mixed} context Only remove listeners matching this context.
 * @param {Boolean} once Only remove once listeners.
 * @api public
 */
EventEmitter.prototype.removeListener = function removeListener(event, fn, context, once) {
  var evt = prefix ? prefix + event : event;

  if (!this._events || !this._events[evt]) return this;

  var listeners = this._events[evt]
    , events = [];

  if (fn) {
    if (listeners.fn) {
      if (
           listeners.fn !== fn
        || (once && !listeners.once)
        || (context && listeners.context !== context)
      ) {
        events.push(listeners);
      }
    } else {
      for (var i = 0, length = listeners.length; i < length; i++) {
        if (
             listeners[i].fn !== fn
          || (once && !listeners[i].once)
          || (context && listeners[i].context !== context)
        ) {
          events.push(listeners[i]);
        }
      }
    }
  }

  //
  // Reset the array, or remove it completely if we have no more listeners.
  //
  if (events.length) {
    this._events[evt] = events.length === 1 ? events[0] : events;
  } else {
    delete this._events[evt];
  }

  return this;
};

/**
 * Remove all listeners or only the listeners for the specified event.
 *
 * @param {String} event The event want to remove all listeners for.
 * @api public
 */
EventEmitter.prototype.removeAllListeners = function removeAllListeners(event) {
  if (!this._events) return this;

  if (event) delete this._events[prefix ? prefix + event : event];
  else this._events = prefix ? {} : Object.create(null);

  return this;
};

//
// Alias methods names because people roll like that.
//
EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
EventEmitter.prototype.addListener = EventEmitter.prototype.on;

//
// This function doesn't apply anymore.
//
EventEmitter.prototype.setMaxListeners = function setMaxListeners() {
  return this;
};

//
// Expose the prefix.
//
EventEmitter.prefixed = prefix;

//
// Expose the module.
//
if ('undefined' !== typeof module) {
  module.exports = EventEmitter;
}

},{}],7:[function(require,module,exports){
'use strict'

function attrsPresent (node) {
  const x = node[1]
  return (typeof x === 'object' && !Array.isArray(x))
}

function rawAttrs (node) {
  const x = node[1]
  if (typeof x === 'object' && !Array.isArray(x)) {
    return x
  }
  return {}
}

function children (node) {
  if (attrsPresent(node)) {
    return node.slice(2)
  }
  return node.slice(1)
}

function child (node, index) {
  if (attrsPresent(node)) {
    return node[index + 2]
  }
  return node[index + 1]
}

function numChildren (node) {
  let result = node.length - 1
  if (attrsPresent(node)) result--
  return result
}

function forEachChild (node, f) {
  const from = attrsPresent(node) ? 2 : 1
  for (let i = from; i < node.length; i++) {
    const n = node[i]
    if (typeof n === 'string' || typeof n === 'number' || Array.isArray(n)) {
      f(n)
    } else {
      throw Error('arraydom wrong type value, ' + JSON.stringify(n) + ', index '+ i + ' of ' + JSON.stringify(node), node)
    }
  }
}

function tagName (node) {
  const parts = node[0].split(' ')
  return parts[0]
}

function embeddedClassNames (node) {
  const parts = node[0].split(' ')
  if (parts.length > 1) {
    return parts.slice(1).join(' ')
  }
  return ''
}

function attrNames (node, includeHidden, rawStyle) {
  const a = rawAttrs(node)
  const result1 = Object.getOwnPropertyNames(a)
  if (a['class'] === undefined && embeddedClassNames(node)) {
    result1.push('class')
  }
  const result2 = []
  let hasStyle = false
  for (let key of result1) {
    if (!rawStyle) {
      if (key[0] === '$' || key.startsWith('style.')) {
        hasStyle = true
        continue
      }
    }
    if (key[0] === '_' && !includeHidden) {
      continue
    }
    result2.push(key)
  }
  if (hasStyle) {
    result2.push('style')
  }
  result2.sort()
  return result2
}

function attr (node, key) {
  const a = rawAttrs(node)
  if (key === 'style') {
    const val = []
    let s = (a.style || '').trim()
    if (s.endsWith(';')) {  // remove trailining semi if there is one
      s = s.slice(0, -1)
    }
    if (s) {
      val[0] = s
    }
    for (let sk of Object.getOwnPropertyNames(a)) {
      for (let pre of ['$', 'style.']) {
        if (sk.startsWith(pre)) {
          let k = sk.slice(pre.length)
          val.push(k + ': ' + a[sk])
        }
      }
    }
    val.sort() // mostly just for easier testing
    return val.length ? val.join('; ') : undefined
  } else if (key === 'class') {
    let both = Object.getOwnPropertyNames(classesAsKeys(node))
    both.sort()
    if (both.length === 0) {
      return undefined
    } else {
      return both.join(' ')
    }
  } else {
    return a[key]
  }
}

function classesAsKeys (node) {
  const a = rawAttrs(node)
  let s1 = (a['class'] || '').split(' ')
  let s2 = embeddedClassNames(node).split(' ')
  let both = s1.concat(s2)
  let bothObj = {}
  both.forEach((x) => { if (x) { bothObj[x] = true } })
  return bothObj
}

function walk (node, func) {
  func(node)
  forEachChild(node, (x) => walk(x, func))
}

function walkAttrValues (node, func) {
  walk(node, n => {
    for (let key of attrNames(node)) {
      func(node, key)
    }
  })
}

function find (filter, node, func) {
  if (typeof filter === 'string') {
    filter = (x) => match(node, filter)
  }
  if (filter(node)) func(node)
  forEachChild(node, (x) => find(filter, x, func))
}

function match (node, pattern) {
  let parts = pattern.split(' ')
  for (let part of parts) {
    if (part.startsWith('.')) {
      let target = part.slice(1)
      let classes = classesAsKeys(node)
      if (classes[target]) return true
    } else if (part.startsWith('#')) {
      if (attr(node, 'id') === part.slice(1)) return true
    } else {
      if (tagName(node) === part) return true
    }
  }
  return false
}

function expanded (node) {
  if (typeof node === 'string' || typeof node === 'number') return node
  const result = [ tagName(node),
                   attrsCopy(node) ]
  forEachChild(node, (x) => { result.push(expanded(x)) })
  return result
}

function attrsCopy (node) {
  const result = {}
  for (let key of attrNames(node)) {
    result[key] = attr(node, key)
  }
  return result
}

function compacted (node) {
  if (typeof node === 'string') return node
  const result = [ tagName(node) ]
  const attrObj = {}
  for (let key of attrNames(node)) {
    let val = attr(node, key)
    if (key === 'class') {
      result[0] += ' ' + val
    } else if (key === 'style') {
      if (val.indexOf('"') !== -1 || val.indexOf("'") !== -1) {
        // not safe to split
        attrObj.style = val
      } else {
        let styles = val.split(';')
        for (let line of styles) {
          let lr = line.split(':')
          if (lr.length !== 2) {
            throw Error('having trouble with splitting style value:' +
                        JSON.stringify(val))
          }
          attrObj['$' + lr[0]] = lr[1].trim()
        }
      }
    } else {
      attrObj[key] = val
    }
  }
  if (Object.getOwnPropertyNames(attrObj).length > 0) {
    result.push(attrObj)
  }
  forEachChild(node, (x) => { result.push(compacted(x)) })
  return result
}

module.exports.children = children
module.exports.forEachChild = forEachChild
module.exports.tagName = tagName
module.exports.attrNames = attrNames
module.exports.attr = attr
module.exports.numChildren = numChildren
module.exports.child = child
module.exports.walk = walk
module.exports.walkAttrValues = walkAttrValues
module.exports.find = find
module.exports.match = match
module.exports.expanded = expanded
module.exports.compacted = compacted

// maybe... internal
module.exports.attrsPresent = attrsPresent
module.exports.rawAttrs = rawAttrs

},{}],8:[function(require,module,exports){
'use strict'

const domdriver = require('../../domdriver')
const EventEmitter = require('eventemitter3')

const db1 = (() => {
  const data = { now: 'starting' }
  const db      = new EventEmitter()
  db.values = () => data
  
  let n = 0
  if (true) {
    setInterval( () => {
      data.now = '' + (new Date()) + '  counter=' + n++
      db.emit('change')
    }, 1)
  }
  return db
})()

const db2 = (() => {
  const data = { now: 'starting' }
  const db = {}
  db.values = () => data
  
  let n = 0
  if (true) {
    setInterval( () => {
      data.now = '' + (new Date()) + '  counter=' + n++
    }, 1)
  }
  return db
})()


const db3 = (() => {
  const data = { now: 'starting' }
  const db = {}
  db.values = () => data
  
  let n = 0
  if (true) {
    setInterval( () => {
      data.now = '' + (new Date()) + '  counter=' + n++
    }, 1)
  }
  return db
})()


domdriver.create('e1', [func, {$fontWeight: 'bold'}, db1] )
domdriver.create('e2', [func, {$fontWeight: 'bold'}, db2], { poll: 1} )

const dd3 = domdriver.create('e3', [func, {$fontWeight: 'bold'}, db3] )
setInterval( () => {
  dd3.touch()
}, 1)

function func (attrs, q) {
  // console.log('func', attrs, q.values().now)
  return [b, attrs, q.values().now]
}

// Amusingly let you say [b, ...] instead of ['b', ...]
function b (...args) {
  const result = ['b']
  Array.prototype.push.apply(result, args)
  return result
}

(function b1 () {
  const tree = ['p', {}, ['button', { onclick: click}, 'Click Me']]
  const dd = domdriver.create('b1', tree)
  function click () {
    tree.push(' Clicked! ')
    dd.touch()
  }
})();


(() => {
  const tree = ['p', {}, ['button', { onclick: click}, '1-second-poll Click Me']]
  const dd = domdriver.create('b2', tree, { poll: 1000} )
  function click () {
    tree.push(' Clicked! ')
  }
})();

(() => {
  const tree = ['p', {}, ['input', { onchange: change,
                                     oninput: input,
                                     placeholder: 'type here!'}]]
  const dd = domdriver.create('b3', tree)
  function input (ev) {
    tree.splice(3)
    tree[3] = ' text: ' + JSON.stringify(ev.target.value)
    dd.touch()
  }
  function change (ev) {
    tree.push(' (got change event) ')
    dd.touch()
  }
})();

},{"../../domdriver":5,"eventemitter3":6}]},{},[8]);
