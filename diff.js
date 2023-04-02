'use strict'

/*

  Compute a relatively minimal set of changes one would need to make
  to tree-a to turn it into tree-b.

OPERATIONS

  Our operations are DOM Level 1 operations, so you could use this to
  alter the DOM.  Operations:

  { method: 'remove',     
    object: refno of node to be removed }
  { method: 'appendChild'
    parent: refno of node to which a child will be added,
    child: refno of new child }
  { method: 'insertBefore'
    sibling: refno
    inserted: refno }
  { method: 'setAttribute',
    attribute: 'attrname'              '$foo-bar' means '.style.fooBar'
    value: 'value' }

 
  OR COMPACT:
     [ 'D', refno ]
     [ 'A', parent refno, childrefno ]
     [ 'I', sibling refno, childrefno ]
     [ 'S', attr, val ]

REFNOs

  We refer to nodes using integers.  Integers >= 0 are the position in
  the tree via pre-order tranversal.  That is, 0 is the root, 1 is the
  first child of the root, 2 is that roots first child, etc.

  references(operations) returns a sorted array of all the refnos the
  patch uses.  This can be used in one pass to make a map from refno
  to nodes in tree-a






  
