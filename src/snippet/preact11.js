const MODE_HYDRATE = 1 << 5
const MODE_SUSPENDED = 1 << 7
const INSERT_VNODE = 1 << 2
const MATCHED = 1 << 1
const FORCE_PROPS_REVALIDATE = 1 << 0
const REF_DETACHED = 1 << 3
const COMPONENT_PROCESSING_EXCEPTION = 1 << 0
const COMPONENT_PENDING_ERROR = 1 << 1
const COMPONENT_FORCE = 1 << 2
const COMPONENT_DIRTY = 1 << 3
const RESET_MODE = ~(32 | 128)
const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const XHTML_NAMESPACE = 'http://www.w3.org/1999/xhtml'
const MATH_NAMESPACE = 'http://www.w3.org/1998/Math/MathML'
const NULL = null
const UNDEFINED = undefined
const EMPTY_OBJ = {}
const EMPTY_ARR = []
const MATHML_TOKEN_ELEMENTS = /^m(i|n|o|s|text|space)$/

const isArray$1 = Array.isArray
const slice = EMPTY_ARR.slice
const assign$1 = Object.assign
function removeNode(node) {
  if (node && node.parentNode) node.remove()
}

function _catchError(error, vnode, oldVNode, errorInfo) {
  let component, ctor, handled
  for (; (vnode = vnode._parent); ) {
    if ((component = vnode._component) && !(component._bits & 1)) {
      component._bits |= 4
      try {
        ctor = component.constructor
        if (ctor && ctor.getDerivedStateFromError) {
          component.setState(ctor.getDerivedStateFromError(error))
          handled = component._bits & 8
        }
        if (component.componentDidCatch) {
          component.componentDidCatch(error, errorInfo || {})
          handled = component._bits & 8
        }
        if (handled) {
          component._bits |= 2
          return
        }
      } catch (e) {
        error = e
        handled = 0
      }
    }
  }
  resetRenderCount()
  throw error
}

const options$1 = { _catchError }

let vnodeId$1 = 0
function createElement(type, props, children) {
  let normalizedProps = {},
    key,
    ref,
    i,
    length = arguments.length
  for (i in props) {
    if (i == 'key') key = props[i]
    else if (i == 'ref' && typeof type != 'function') ref = props[i]
    else normalizedProps[i] = props[i]
  }
  if (length > 2) {
    normalizedProps.children = length > 3 ? slice.call(arguments, 2) : children
  }
  return createVNode$1(type, normalizedProps, key, ref, null)
}
function cloneElement(vnode, props, children) {
  let normalizedProps = assign$1({}, vnode.props),
    key,
    ref,
    i,
    length = arguments.length
  for (i in props) {
    if (i == 'key') key = props[i]
    else if (i == 'ref' && typeof vnode.type != 'function') ref = props[i]
    else normalizedProps[i] = props[i]
  }
  if (length > 2) {
    normalizedProps.children = length > 3 ? slice.call(arguments, 2) : children
  }
  return createVNode$1(
    vnode.type,
    normalizedProps,
    key !== void 0 ? key : vnode.key,
    ref !== void 0 ? ref : vnode.ref,
    null,
  )
}
function createVNode$1(type, props, key, ref, original) {
  const vnode = {
    type,
    props,
    key,
    ref,
    _children: null,
    _parent: null,
    _depth: 0,
    _dom: null,
    _component: null,
    constructor: void 0,
    _original: original || ++vnodeId$1,
    _index: -1,
    _flags: 0,
  }
  if (!original && options$1.vnode) options$1.vnode(vnode)
  return vnode
}
function createRef() {
  return { current: null }
}
function Fragment(props) {
  return props.children
}
const isValidElement = (vnode) => vnode != null && vnode.constructor === void 0

function BaseComponent(props, context) {
  this.props = props
  this.context = context
  this._bits = 0
}
BaseComponent.prototype.setState = function (update, callback) {
  let s = this._nextState
  if (!s || s == this.state) {
    s = this._nextState = assign$1({}, this.state)
  }
  if (typeof update == 'function') {
    update = update(assign$1({}, s), this.props)
  }
  if (update) {
    assign$1(s, update)
  } else {
    return
  }
  if (this._vnode) {
    if (callback) {
      this._stateCallbacks.push(callback)
    }
    enqueueRender(this)
  }
}
BaseComponent.prototype.forceUpdate = function (callback) {
  if (this._vnode) {
    this._bits |= 4
    if (callback) this._renderCallbacks.push(callback)
    enqueueRender(this)
  }
}
BaseComponent.prototype.render = Fragment
function getDomSibling(vnode, childIndex) {
  if (childIndex == null) {
    return vnode._parent ? getDomSibling(vnode._parent, vnode._index + 1) : null
  }
  let sibling
  for (; childIndex < vnode._children.length; childIndex++) {
    sibling = vnode._children[childIndex]
    if (sibling && sibling._dom) {
      return sibling._dom
    }
  }
  return typeof vnode.type == 'function' && !vnode.props._parentDom ? getDomSibling(vnode) : null
}
function renderComponent(component) {
  const oldVNode = component._vnode,
    oldDom = oldVNode._dom,
    commitQueue = [],
    refQueue = []
  const parentDom = component._parentDom
  if (parentDom) {
    const newVNode = assign$1({ constructor: void 0 }, oldVNode)
    newVNode._original = oldVNode._original + 1
    if (options$1.vnode) options$1.vnode(newVNode)
    diff(
      parentDom,
      newVNode,
      oldVNode,
      component._globalContext,
      parentDom.namespaceURI,
      oldVNode._flags & 32 ? [oldDom] : null,
      commitQueue,
      oldDom || getDomSibling(oldVNode),
      oldVNode._flags & 32,
      refQueue,
    )
    newVNode._original = oldVNode._original
    newVNode._parent._children[newVNode._index] = newVNode
    commitRoot(commitQueue, newVNode, refQueue)
    oldVNode._parent = oldVNode._dom = null
    if (newVNode._dom != oldDom) {
      updateParentDomPointers(newVNode)
    }
  }
}
function updateParentDomPointers(vnode) {
  if ((vnode = vnode._parent) && vnode._component && !vnode.props._parentDom) {
    vnode._dom = null
    vnode._children.some((child) => child && (vnode._dom = child._dom))
    return updateParentDomPointers(vnode)
  }
}
const rerenderQueue = []
let prevDebounce
let rerenderCount = 0
function resetRenderCount() {
  rerenderCount = 0
}
function enqueueRender(c) {
  if (
    (!(c._bits & 8) && (c._bits |= 8) && rerenderQueue.push(c) && !rerenderCount++) ||
    prevDebounce != options$1.debounceRendering
  ) {
    prevDebounce = options$1.debounceRendering
    ;(prevDebounce || queueMicrotask)(process)
  }
}
const depthSort = (a, b) => a._vnode._depth - b._vnode._depth
function process() {
  try {
    let c,
      l = 1
    while (rerenderQueue.length) {
      if (rerenderQueue.length > l) {
        rerenderQueue.sort(depthSort)
      }
      c = rerenderQueue.shift()
      l = rerenderQueue.length
      if (c._bits & 8) {
        renderComponent(c)
      }
    }
  } finally {
    rerenderQueue.length = rerenderCount = 0
  }
}

function diffChildren(
  parentDom,
  renderResult,
  newParentVNode,
  oldParentVNode,
  globalContext,
  namespace,
  excessDomChildren,
  commitQueue,
  oldDom,
  isHydrating,
  refQueue,
) {
  let i, oldVNode, childVNode, newDom, firstChildDom
  let oldChildren = oldParentVNode._children || EMPTY_ARR
  let newChildrenLength = renderResult.length
  oldDom = constructNewChildrenArray(
    newParentVNode,
    renderResult,
    oldChildren,
    oldDom,
    newChildrenLength,
  )
  for (i = 0; i < newChildrenLength; i++) {
    childVNode = newParentVNode._children[i]
    if (childVNode == null) continue
    oldVNode = (~childVNode._index && oldChildren[childVNode._index]) || EMPTY_OBJ
    childVNode._index = i
    let result = diff(
      parentDom,
      childVNode,
      oldVNode,
      globalContext,
      namespace,
      excessDomChildren,
      commitQueue,
      oldDom,
      isHydrating,
      refQueue,
    )
    newDom = childVNode._dom
    if (oldVNode.ref != childVNode.ref || oldVNode._flags & 8) {
      if (oldVNode.ref) applyRef(oldVNode.ref, null, childVNode, oldVNode)
      if (childVNode.ref) {
        refQueue.push(childVNode.ref, childVNode._component || newDom, childVNode)
      }
    }
    firstChildDom = firstChildDom || newDom
    if (childVNode._flags & 4) {
      oldDom = insert(childVNode, oldDom, parentDom, !oldVNode._original)
      if (oldVNode._dom) {
        oldVNode._dom = null
      }
    } else if (typeof childVNode.type == 'function' && result !== void 0) {
      oldDom = result
    } else if (newDom) {
      oldDom = newDom.nextSibling
    }
    childVNode._flags &= ~(4 | 2)
  }
  newParentVNode._dom = firstChildDom
  return oldDom
}
function constructNewChildrenArray(
  newParentVNode,
  renderResult,
  oldChildren,
  oldDom,
  newChildrenLength,
) {
  let i
  let childVNode
  let oldVNode
  let oldChildrenLength = oldChildren.length,
    remainingOldChildren = oldChildrenLength
  let skew = 0
  let moved = false
  let newChildren = (newParentVNode._children = Array(newChildrenLength))
  for (i = 0; i < newChildrenLength; i++) {
    childVNode = renderResult[i]
    if (childVNode == null || typeof childVNode == 'boolean' || typeof childVNode == 'function') {
      newChildren[i] = null
      continue
    } else if (typeof childVNode != 'object' || childVNode.constructor == String) {
      childVNode = newChildren[i] = createVNode$1(null, childVNode)
    } else if (isArray$1(childVNode)) {
      childVNode = newChildren[i] = createVNode$1(Fragment, {
        children: childVNode,
      })
    } else if (childVNode.constructor === void 0 && childVNode._depth) {
      childVNode = newChildren[i] = createVNode$1(
        childVNode.type,
        childVNode.props,
        childVNode.key,
        childVNode.ref,
        childVNode._original,
      )
    } else {
      newChildren[i] = childVNode
    }
    const skewedIndex = i + skew
    childVNode._parent = newParentVNode
    childVNode._depth = newParentVNode._depth + 1
    const matchingIndex = (childVNode._index = findMatchingIndex(
      childVNode,
      oldChildren,
      skewedIndex,
      remainingOldChildren,
    ))
    oldVNode = null
    if (~matchingIndex) {
      oldVNode = oldChildren[matchingIndex]
      remainingOldChildren--
      if (oldVNode) {
        oldVNode._flags |= 2
      }
    }
    if (!oldVNode || !oldVNode._original) {
      if (!~matchingIndex) {
        if (newChildrenLength > oldChildrenLength) {
          skew--
        } else if (newChildrenLength < oldChildrenLength) {
          skew++
        }
      }
      if (typeof childVNode.type != 'function') {
        childVNode._flags |= 4
      }
    } else {
      childVNode._flags |= 2
      if (matchingIndex == skewedIndex - 1) {
        skew--
      } else if (matchingIndex == skewedIndex + 1) {
        skew++
      } else if (matchingIndex != skewedIndex) {
        if (matchingIndex > skewedIndex) {
          skew--
        } else {
          skew++
        }
        moved = true
      }
    }
  }
  if (moved) {
    let tails = []
    let lisLengths = []
    for (i = 0; i < newChildrenLength; i++) {
      childVNode = newChildren[i]
      if (childVNode && childVNode._flags & 2) {
        let lo = 0,
          hi = tails.length
        while (lo < hi) {
          const mid = (lo + hi) >> 1
          if (tails[mid] < childVNode._index) {
            lo = mid + 1
          } else {
            hi = mid
          }
        }
        tails[lo] = childVNode._index
        lisLengths[i] = lo + 1
      }
    }
    skew = tails.length
    while (i--) {
      if (lisLengths[i]) {
        if (lisLengths[i] == skew) {
          skew--
        } else {
          newChildren[i]._flags |= 4
        }
      }
    }
  }
  if (remainingOldChildren) {
    for (i = 0; i < oldChildrenLength; i++) {
      oldVNode = oldChildren[i]
      if (oldVNode && !(oldVNode._flags & 2)) {
        if (oldVNode._dom == oldDom) {
          oldDom = getDomSibling(oldVNode)
        }
        unmount(oldVNode, oldVNode)
      }
    }
  }
  return oldDom
}
function insert(parentVNode, oldDom, parentDom, isMounting) {
  if (typeof parentVNode.type == 'function') {
    if (parentVNode.props._parentDom) return oldDom
    let children = parentVNode._children
    if (children) {
      for (let i = 0; i < children.length; i++) {
        if (children[i]) {
          children[i]._parent = parentVNode
          oldDom = insert(children[i], oldDom, parentDom, false)
        }
      }
    }
    return oldDom
  } else {
    if (oldDom && !oldDom.parentNode) {
      oldDom = getDomSibling(parentVNode)
      if (oldDom && !oldDom.parentNode) oldDom = null
    }
    let next = oldDom
    while (next && next.nodeType == 8) next = next.nextSibling
    if (parentVNode._dom != next) {
      if (!isMounting && parentDom.moveBefore && parentVNode._dom.parentNode) {
        parentDom.moveBefore(parentVNode._dom, oldDom)
      } else {
        parentDom.insertBefore(parentVNode._dom, oldDom || null)
      }
    }
    oldDom = parentVNode._dom
  }
  while ((oldDom = oldDom && oldDom.nextSibling) && oldDom.nodeType == 8);
  return oldDom
}
function toChildArray(children, out) {
  out = out || []
  if (children != null && typeof children != 'boolean') {
    if (isArray$1(children)) {
      children.some((child) => {
        toChildArray(child, out)
      })
    } else {
      out.push(children)
    }
  }
  return out
}
function findMatchingIndex(childVNode, oldChildren, skewedIndex, remainingOldChildren) {
  const key = childVNode.key
  const type = childVNode.type
  let oldVNode = oldChildren[skewedIndex]
  const matched = oldVNode && !(oldVNode._flags & 2)
  let shouldSearch = remainingOldChildren > (matched ? 1 : 0)
  if (
    (oldVNode === null && key == null) ||
    (matched && key == oldVNode.key && type == oldVNode.type)
  ) {
    return skewedIndex
  } else if (shouldSearch) {
    let x = skewedIndex - 1
    let y = skewedIndex + 1
    while (x >= 0 || y < oldChildren.length) {
      const childIndex = x >= 0 ? x-- : y++
      oldVNode = oldChildren[childIndex]
      if (oldVNode && !(oldVNode._flags & 2) && key == oldVNode.key && type == oldVNode.type) {
        return childIndex
      }
    }
  }
  return -1
}

let EVENT_DISPATCHED = Symbol()
function setStyle(style, key, value) {
  if (value == null) value = ''
  if (key[0] == '-') {
    style.setProperty(key, value)
  } else {
    style[key] = value
  }
}
const CAPTURE_REGEX = /(PointerCapture)$|Capture$/i
let eventClock = 0
function setProperty(dom, name, value, oldValue, namespace) {
  let useCapture
  o: if (name == 'style') {
    if (typeof value == 'string') {
      dom.style.cssText = value
    } else {
      if (typeof oldValue == 'string') {
        dom.style.cssText = oldValue = ''
      }
      if (oldValue) {
        for (name in oldValue) {
          if (!(value && name in value)) {
            setStyle(dom.style, name, '')
          }
        }
      }
      if (value) {
        for (name in value) {
          if (!oldValue || value[name] != oldValue[name]) {
            setStyle(dom.style, name, value[name])
          }
        }
      }
    }
  } else if (name[0] == 'o' && name[1] == 'n') {
    ;(dom._listeners || (dom._listeners = {}))[name] = value
    if (!value || !oldValue) {
      const proxy = eventProxies[name] || (eventProxies[name] = createEventProxy(name))
      ;(dom._attached || (dom._attached = {}))[name] = eventClock
      useCapture = name != (name = name.replace(CAPTURE_REGEX, '$1'))
      name = name.slice(2)
      if (name[0] < 'a') name = name.toLowerCase()
      if (value) {
        dom.addEventListener(name, proxy, useCapture)
      } else {
        dom.removeEventListener(name, proxy, useCapture)
      }
    }
  } else {
    if (namespace == 'http://www.w3.org/2000/svg') {
      name = name.replace(/xlink(H|:h)/, 'h').replace(/sName$/, 's')
    } else if (
      name != 'width' &&
      name != 'height' &&
      name != 'href' &&
      name != 'list' &&
      name != 'form' &&
      name != 'tabIndex' &&
      name != 'download' &&
      name != 'rowSpan' &&
      name != 'colSpan' &&
      name != 'role' &&
      name != 'popover' &&
      name in dom
    ) {
      try {
        dom[name] = value == null ? '' : value
        break o
      } catch (e) {}
    }
    if (typeof value == 'function') {
    } else if (value != null && (value !== false || name[4] == '-')) {
      dom.setAttribute(name, name == 'popover' && value == true ? '' : value)
    } else {
      dom.removeAttribute(name)
    }
  }
}
function createEventProxy(name) {
  return function (e) {
    if (this._listeners) {
      const eventHandler = this._listeners[name]
      if (e[EVENT_DISPATCHED] == null) {
        e[EVENT_DISPATCHED] = eventClock++
      } else if (e[EVENT_DISPATCHED] < this._attached[name]) {
        return
      }
      return eventHandler(options$1.event ? options$1.event(e) : e)
    }
  }
}
const eventProxies = {}

function diff(
  parentDom,
  newVNode,
  oldVNode,
  globalContext,
  namespace,
  excessDomChildren,
  commitQueue,
  oldDom,
  isHydrating,
  refQueue,
) {
  let tmp,
    resumed,
    newType = newVNode.type
  if (newVNode.constructor !== void 0) return null
  if (
    oldVNode._flags & 128 &&
    ((isHydrating = oldVNode._flags & 32), (tmp = oldVNode._component._excess))
  ) {
    newVNode._flags |= isHydrating
    resumed = excessDomChildren = []
    if (tmp.nodeType == 8) {
      for (let depth = 1, node = tmp.nextSibling; node; node = node.nextSibling) {
        if (node.nodeType == 8) {
          if (node.data.startsWith('$s')) depth++
          else if (node.data.startsWith('/$s') && !--depth) break
        }
        excessDomChildren.push(node)
      }
    } else {
      excessDomChildren.push(tmp)
    }
    oldDom = excessDomChildren[0]
  }
  if ((tmp = options$1._diff)) tmp(newVNode)
  outer: if (typeof newType == 'function') {
    let oldCommitQueueLength = commitQueue.length
    try {
      let c,
        oldProps,
        oldState,
        snapshot,
        newProps = newVNode.props
      const isClassComponent = (tmp = newType.prototype) && tmp.render
      tmp = newType.contextType
      const provider = tmp && globalContext[tmp._id]
      const componentContext = tmp
        ? provider
          ? provider.props.value
          : tmp._defaultValue
        : globalContext
      if (oldVNode._component) {
        c = newVNode._component = oldVNode._component
        if (c._bits & 2) {
          c._bits |= 1
        }
      } else {
        if (isClassComponent) {
          newVNode._component = c = new newType(newProps, componentContext)
        } else {
          newVNode._component = c = new BaseComponent(newProps, componentContext)
          c.constructor = newType
          c.render = doRender
        }
        if (provider) provider.sub(c)
        if (!c.state) c.state = {}
        c._globalContext = globalContext
        c._bits |= 8
        c._renderCallbacks = []
        c._stateCallbacks = []
      }
      if (isClassComponent) {
        if (!c._nextState) c._nextState = c.state
        if (newType.getDerivedStateFromProps) {
          if (c._nextState == c.state) {
            c._nextState = assign$1({}, c._nextState)
          }
          assign$1(c._nextState, newType.getDerivedStateFromProps(newProps, c._nextState))
        }
      }
      oldProps = c.props
      oldState = c.state
      c._vnode = newVNode
      if (!oldVNode._component) {
        if (isClassComponent && !newType.getDerivedStateFromProps && c.componentWillMount) {
          c.componentWillMount()
        }
        if (isClassComponent && c.componentDidMount) {
          c._renderCallbacks.push(c.componentDidMount)
        }
      } else {
        if (
          isClassComponent &&
          !newType.getDerivedStateFromProps &&
          newProps !== oldProps &&
          c.componentWillReceiveProps
        ) {
          c.componentWillReceiveProps(newProps, componentContext)
        }
        if (
          (newVNode._original == oldVNode._original && !(c._bits & 8)) ||
          (!(c._bits & 4) &&
            c.shouldComponentUpdate &&
            c.shouldComponentUpdate(newProps, c._nextState, componentContext) === false)
        ) {
          if (newVNode._original != oldVNode._original) {
            c.props = newProps
            c.state = c._nextState
            c._bits &= ~8
          }
          newVNode._dom = oldVNode._dom
          newVNode._children = oldVNode._children
          newVNode._children.some((vnode) => {
            if (vnode) vnode._parent = newVNode
          })
          EMPTY_ARR.push.apply(c._renderCallbacks, c._stateCallbacks)
          c._stateCallbacks = []
          if (c._renderCallbacks.length) {
            commitQueue.push(c)
          }
          oldDom = getDomSibling(oldVNode)
          break outer
        }
        if (c.componentWillUpdate) {
          c.componentWillUpdate(newProps, c._nextState, componentContext)
        }
        if (isClassComponent && c.componentDidUpdate) {
          c._renderCallbacks.push(() => {
            c.componentDidUpdate(oldProps, oldState, snapshot)
          })
        }
      }
      c.context = componentContext
      c.props = newProps
      c._parentDom = parentDom
      c._bits &= ~4
      let renderHook = options$1._render,
        count = 0
      if (isClassComponent) {
        c.state = c._nextState
        c._bits &= ~8
        if (renderHook) renderHook(newVNode)
        tmp = c.render(c.props, c.state, c.context)
        EMPTY_ARR.push.apply(c._renderCallbacks, c._stateCallbacks)
        c._stateCallbacks = []
      } else {
        do {
          c._bits &= ~8
          if (renderHook) renderHook(newVNode)
          tmp = c.render(c.props, c.state, c.context)
          c.state = c._nextState
        } while (c._bits & 8 && ++count < 25)
      }
      c.state = c._nextState
      if (c.getChildContext) {
        globalContext = assign$1({}, globalContext, c.getChildContext())
      }
      if (isClassComponent && oldVNode._component && c.getSnapshotBeforeUpdate) {
        snapshot = c.getSnapshotBeforeUpdate(oldProps, oldState)
      }
      const renderResult =
        tmp && tmp.type === Fragment && tmp.key == null ? tmp.props.children : tmp
      if (newProps._parentDom) {
        tmp = oldDom
        parentDom = newProps._parentDom
        namespace = parentDom.namespaceURI
        isHydrating = excessDomChildren = null
        if (oldVNode.props && oldVNode.props._parentDom != parentDom) {
          oldVNode._children.some((child) => {
            if (child) unmount(child, child)
          })
          oldVNode._children = null
        }
        oldDom = oldVNode._children ? getDomSibling(oldVNode, 0) : null
      }
      oldDom = diffChildren(
        parentDom,
        isArray$1(renderResult) ? renderResult : [renderResult],
        newVNode,
        oldVNode,
        globalContext,
        namespace,
        excessDomChildren,
        commitQueue,
        oldDom,
        isHydrating,
        refQueue,
      )
      if (newProps._parentDom) {
        newVNode._dom = null
        oldDom = tmp
      }
      newVNode._flags &= RESET_MODE
      if (oldVNode._flags & 128) c._excess = null
      if (resumed) resumed.some(removeNode)
      if (c._renderCallbacks.length) {
        commitQueue.push(c)
      }
      if (c._bits & 1) {
        c._bits &= ~(1 | 2)
      }
    } catch (e) {
      commitQueue.length = oldCommitQueueLength
      newVNode._original = null
      if (isHydrating || excessDomChildren) {
        if (e.then) {
          let commentMarkersToFind = 0,
            startMarker
          newVNode._flags |= isHydrating ? 32 | 128 : 128
          if (excessDomChildren) {
            let i = excessDomChildren.indexOf(oldDom || void 0),
              child
            if (!~i) i = excessDomChildren.length
            while ((child = excessDomChildren[i - 1]) && child.nodeType == 8) {
              i--
            }
            for (; i < excessDomChildren.length; i++) {
              child = excessDomChildren[i]
              if (!child) continue
              excessDomChildren[i] = null
              if (child.nodeType == 8) {
                if (child.data.startsWith('$s')) {
                  if (!commentMarkersToFind++) startMarker = child
                } else if (
                  commentMarkersToFind &&
                  child.data.startsWith('/$s') &&
                  !--commentMarkersToFind
                ) {
                  oldDom = child
                  break
                }
              } else if (!commentMarkersToFind) {
                break
              }
            }
          }
          if (!startMarker) {
            while (oldDom && oldDom.nodeType == 8 && oldDom.nextSibling) {
              oldDom = oldDom.nextSibling
            }
            startMarker = oldDom
          }
          if (!newVNode._component._excess) {
            newVNode._component._excess = startMarker
          }
          newVNode._dom = oldDom
        } else if (excessDomChildren) {
          excessDomChildren.some(removeNode)
        }
      } else {
        newVNode._dom = oldVNode._dom
      }
      if (!newVNode._children) {
        newVNode._children = oldVNode._children || []
      }
      if (!e.then) markAsForce(newVNode)
      options$1._catchError(e, newVNode, oldVNode)
    }
  } else {
    oldDom = newVNode._dom = diffElementNodes(
      oldVNode._dom,
      newVNode,
      oldVNode,
      globalContext,
      namespace,
      excessDomChildren,
      commitQueue,
      isHydrating,
      refQueue,
      parentDom,
    )
  }
  if ((tmp = options$1.diffed)) tmp(newVNode)
  return newVNode._flags & 128 ? void 0 : oldDom
}
function markAsForce(vnode) {
  if (vnode) {
    if (vnode._component) vnode._component._bits |= 4
    if (vnode._children) vnode._children.some(markAsForce)
  }
}
function commitRoot(commitQueue, root, refQueue) {
  for (let i = 0; i < refQueue.length; ) {
    applyRef(refQueue[i++], refQueue[i++], refQueue[i++])
  }
  if (options$1._commit) options$1._commit(root, commitQueue)
  commitQueue.some((c) => {
    try {
      commitQueue = c._renderCallbacks
      c._renderCallbacks = []
      commitQueue.some((cb) => {
        cb.call(c)
      })
    } catch (e) {
      options$1._catchError(e, c._vnode)
    }
  })
}
function diffElementNodes(
  dom,
  newVNode,
  oldVNode,
  globalContext,
  namespace,
  excessDomChildren,
  commitQueue,
  isHydrating,
  refQueue,
  parentDom,
) {
  let oldProps = oldVNode.props || EMPTY_OBJ
  const newProps = newVNode.props
  const nodeType = newVNode.type
  let i
  let newHtml
  let oldHtml
  let newChildren
  let value
  let inputValue
  let checked
  if (nodeType == 'svg') namespace = SVG_NAMESPACE
  else if (nodeType == 'math') namespace = MATH_NAMESPACE
  else if (!namespace) namespace = XHTML_NAMESPACE
  if (excessDomChildren) {
    for (i = 0; i < excessDomChildren.length; i++) {
      value = excessDomChildren[i]
      if (value && (nodeType ? value.localName == nodeType : value.nodeType == 3)) {
        dom = value
        excessDomChildren[i] = null
        break
      }
    }
  }
  if (!dom) {
    const doc = parentDom.ownerDocument || document
    if (!nodeType) {
      return doc.createTextNode(newProps)
    }
    dom = doc.createElementNS(namespace, nodeType, newProps.is && newProps)
    if (isHydrating) {
      if (options$1._hydrationMismatch) options$1._hydrationMismatch(newVNode, excessDomChildren)
      isHydrating = false
    }
    excessDomChildren = null
  }
  if (!nodeType) {
    if (oldProps !== newProps && (!isHydrating || dom.data != newProps)) {
      dom.data = newProps
    }
  } else {
    parentDom = nodeType == 'template' ? dom.content : dom
    excessDomChildren =
      nodeType == 'textarea' && newProps.defaultValue != null
        ? null
        : excessDomChildren && slice.call(parentDom.childNodes)
    if (!isHydrating && excessDomChildren) {
      oldProps = {}
      for (i = 0; i < dom.attributes.length; i++) {
        value = dom.attributes[i]
        oldProps[value.name] = value.value
      }
    }
    for (i in oldProps) {
      value = oldProps[i]
      if (i == 'dangerouslySetInnerHTML') {
        oldHtml = value
      } else if (
        i != 'children' &&
        !(i in newProps) &&
        !(i == 'value' && 'defaultValue' in newProps) &&
        !(i == 'checked' && 'defaultChecked' in newProps)
      ) {
        setProperty(dom, i, null, value, namespace)
      }
    }
    const shouldRevalidateProps = oldVNode._flags & 1
    for (i in newProps) {
      value = newProps[i]
      if (i == 'children') {
        newChildren = value
      } else if (i == 'dangerouslySetInnerHTML') {
        newHtml = value
      } else if (i == 'value') {
        inputValue = value
      } else if (i == 'checked') {
        checked = value
      } else if (
        (!isHydrating || typeof value == 'function') &&
        (oldProps[i] !== value || (shouldRevalidateProps && value != null))
      ) {
        setProperty(dom, i, value, oldProps[i], namespace)
      }
    }
    if (newHtml) {
      if (
        !isHydrating &&
        (!oldHtml || (newHtml.__html != oldHtml.__html && newHtml.__html != dom.innerHTML))
      ) {
        dom.innerHTML = newHtml.__html
      }
      newVNode._children = []
    } else {
      if (oldHtml) dom.textContent = ''
      if (
        nodeType == 'foreignObject' ||
        (namespace == 'http://www.w3.org/1998/Math/MathML' && MATHML_TOKEN_ELEMENTS.test(nodeType))
      ) {
        namespace = XHTML_NAMESPACE
      }
      diffChildren(
        parentDom,
        isArray$1(newChildren) ? newChildren : [newChildren],
        newVNode,
        oldVNode,
        globalContext,
        namespace,
        excessDomChildren,
        commitQueue,
        excessDomChildren ? excessDomChildren[0] : oldVNode._children && getDomSibling(oldVNode, 0),
        isHydrating,
        refQueue,
      )
      if (excessDomChildren) excessDomChildren.some(removeNode)
    }
    if (!isHydrating || nodeType == 'textarea') {
      i = 'value'
      if (nodeType == 'progress' && inputValue == null) {
        dom.removeAttribute(i)
      } else if (
        inputValue != void 0 &&
        (inputValue !== dom[i] || (nodeType == 'progress' && !inputValue))
      ) {
        setProperty(dom, i, inputValue, oldProps[i], namespace)
      }
      i = 'checked'
      if (checked != void 0 && checked != dom[i]) {
        setProperty(dom, i, checked, oldProps[i], namespace)
      }
    }
  }
  return dom
}
function applyRef(ref, value, vnode, owner) {
  try {
    if (typeof ref == 'function') {
      if (value) value._refCleanup = ref(value) || 1
      else if (owner && (owner = owner._component || owner._dom) && (value = owner._refCleanup)) {
        owner._refCleanup = null
        if (typeof value == 'function') value()
        else ref(null)
      }
    } else ref.current = value
  } catch (e) {
    options$1._catchError(e, vnode)
  }
}
function unmount(vnode, parentVNode, skipRemove) {
  let r
  if (options$1.unmount) options$1.unmount(vnode)
  if ((r = vnode.ref) && (!r.current || r.current == vnode._dom)) {
    applyRef(r, null, parentVNode, vnode)
  }
  if ((r = vnode._component)) {
    if (r.componentWillUnmount) {
      try {
        r.componentWillUnmount()
      } catch (e) {
        options$1._catchError(e, parentVNode)
      }
    }
    r._parentDom = r._globalContext = null
  }
  if ((r = vnode._children)) {
    for (let i = 0; i < r.length; i++) {
      if (r[i]) {
        unmount(
          r[i],
          parentVNode,
          typeof vnode.type == 'function' ? skipRemove && !vnode.props._parentDom : true,
        )
      }
    }
  }
  if ((r = vnode._dom)) {
    if (!skipRemove) removeNode(r)
    if (r._listeners) r._listeners = null
  }
  vnode._dom = vnode._component = vnode._parent = null
}
function doRender(props, state, context) {
  return this.constructor(props, context)
}

function render(vnode, parentDom) {
  if (options$1._root) options$1._root(vnode, parentDom)
  if (parentDom.nodeType == 9) {
    parentDom = parentDom.documentElement
  }
  let isHydrating = vnode && vnode._flags & 32
  let oldVNode = isHydrating ? null : parentDom._children
  parentDom._children = createVNode$1(Fragment, { children: [vnode] })
  let commitQueue = [],
    refQueue = []
  diff(
    parentDom,
    parentDom._children,
    oldVNode || EMPTY_OBJ,
    EMPTY_OBJ,
    parentDom.namespaceURI,
    oldVNode ? null : parentDom.firstChild ? slice.call(parentDom.childNodes) : null,
    commitQueue,
    oldVNode ? oldVNode._dom : parentDom.firstChild,
    isHydrating,
    refQueue,
  )
  commitRoot(commitQueue, parentDom._children, refQueue)
  parentDom._children.props.children = null
}
function hydrate(vnode, parentDom) {
  if (vnode && typeof vnode == 'object') {
    vnode._flags |= 32
  }
  render(vnode, parentDom)
}

let i = 0
function createContext(defaultValue) {
  function Context(props) {
    if (!this.getChildContext) {
      let subs = new Set()
      let ctx = {}
      ctx[Context._id] = this
      this.getChildContext = () => ctx
      this.shouldComponentUpdate = function (_props) {
        if (this.props.value != _props.value) {
          subs.forEach((c) => {
            c._bits |= 4
            enqueueRender(c)
          })
        }
      }
      this.sub = (c) => {
        subs.add(c)
        let old = c.componentWillUnmount
        c.componentWillUnmount = () => {
          subs.delete(c)
          if (old) old.call(c)
        }
      }
    }
    return props.children
  }
  Context._id = '__cC' + i++
  Context._defaultValue = defaultValue
  Context.Consumer = (props, contextValue) => {
    return props.children(contextValue)
  }
  Context.Provider = Context.Consumer.contextType = Context
  return Context
}

function Portal(props) {
  return props.children
}
function createPortal(vnode, container) {
  return createVNode$1(Portal, {
    _parentDom: container,
    children: vnode,
  })
}

const ObjectIs = Object.is
let currentIndex
let currentComponent
let previousComponent
let currentHook = 0
let afterPaintEffects = []
let unmountCleanups = []
const options = options$1
let oldBeforeDiff = options._diff
let oldBeforeRender = options._render
let oldAfterDiff = options.diffed
let oldCommit = options._commit
let oldBeforeUnmount = options.unmount
let oldRoot = options._root
const RAF_TIMEOUT = 35
let prevRaf
options._diff = (vnode) => {
  currentComponent = null
  if (oldBeforeDiff) oldBeforeDiff(vnode)
}
options._root = (vnode, parentDom) => {
  if (vnode && parentDom._children && parentDom._children._mask) {
    vnode._mask = parentDom._children._mask
  }
  if (oldRoot) oldRoot(vnode, parentDom)
}
options._render = (vnode) => {
  if (oldBeforeRender) oldBeforeRender(vnode)
  currentComponent = vnode._component
  currentIndex = 0
  const hooks = currentComponent.__hooks
  if (hooks) {
    if (previousComponent == currentComponent) {
      currentComponent._renderCallbacks = []
    } else {
      hooks._pendingEffects.some(invokeCleanup)
      hooks._pendingEffects.some(invokeEffect)
      currentIndex = 0
    }
    hooks._pendingEffects = []
    hooks._list.some((hookItem) => {
      if (hookItem._nextValue) {
        hookItem._value = hookItem._nextValue
      }
      hookItem._pendingArgs = hookItem._nextValue = undefined
    })
  }
  previousComponent = currentComponent
}
options.diffed = (vnode) => {
  if (oldAfterDiff) oldAfterDiff(vnode)
  const c = vnode._component
  if (c && c.__hooks) {
    if (c.__hooks._pendingEffects.length) afterPaint(afterPaintEffects.push(c))
    c.__hooks._list.some((hookItem) => {
      if (hookItem._pendingArgs) hookItem._args = hookItem._pendingArgs
    })
  }
  previousComponent = currentComponent = null
}
options._commit = (vnode, commitQueue) => {
  commitQueue.some((component) => {
    try {
      component._renderCallbacks.some(invokeCleanup)
      component._renderCallbacks = component._renderCallbacks.filter((cb) =>
        cb._value ? invokeEffect(cb) : true,
      )
    } catch (e) {
      commitQueue.some((c) => {
        if (c._renderCallbacks) c._renderCallbacks = []
      })
      commitQueue = []
      options._catchError(e, component._vnode)
    }
  })
  if (oldCommit) oldCommit(vnode, commitQueue)
}
options.unmount = (vnode) => {
  if (oldBeforeUnmount) oldBeforeUnmount(vnode)
  const c = vnode._component
  if (c && c.__hooks) {
    let hasErrored, errorParent
    c.__hooks._list.some((s) => {
      try {
        if (s._passive && s._cleanup) {
          if (errorParent === undefined) {
            errorParent = vnode._parent
            while (errorParent && !(errorParent._component && errorParent._component._parentDom)) {
              errorParent = errorParent._parent
            }
            errorParent = errorParent && errorParent._component
          }
          s._passive = errorParent
          afterPaint(unmountCleanups.push(s))
        } else {
          invokeCleanup(s)
        }
      } catch (e) {
        hasErrored = e
      }
    })
    c.__hooks = undefined
    if (hasErrored) options._catchError(hasErrored, c._vnode)
  }
}
function getHookState(index, type) {
  if (options._hook) {
    options._hook(currentComponent, index, currentHook || type)
  }
  currentHook = 0
  const hooks =
    currentComponent.__hooks ||
    (currentComponent.__hooks = {
      _list: [],
      _pendingEffects: [],
    })
  if (index >= hooks._list.length) {
    hooks._list.push({})
  }
  return hooks._list[index]
}
function useState(initialState) {
  currentHook = 1
  return useReducer(invokeOrReturn, initialState)
}
function useReducer(reducer, initialState, init) {
  const hookState = getHookState(currentIndex++, 2)
  hookState._reducer = reducer
  if (!hookState._component) {
    hookState._value = [
      !init ? invokeOrReturn(undefined, initialState) : init(initialState),
      (action) => {
        const currentValue = hookState._nextValue ? hookState._nextValue[0] : hookState._value[0]
        const nextValue = hookState._reducer(currentValue, action)
        if (!ObjectIs(currentValue, nextValue)) {
          hookState._nextValue = [nextValue, hookState._value[1]]
          hookState._component.setState({})
        }
      },
    ]
    hookState._component = currentComponent
    if (!currentComponent._hasScuFromHooks) {
      currentComponent._hasScuFromHooks = true
      const prevScu = currentComponent.shouldComponentUpdate
      currentComponent.shouldComponentUpdate = function (p, s, c) {
        const hooks = this.__hooks
        if (!hooks) return true
        let updatedHook = false
        let shouldUpdate = this.props != p
        hooks._list.some((hookItem) => {
          if (hookItem._nextValue) {
            updatedHook = true
            if (!ObjectIs(hookItem._value[0], hookItem._nextValue[0])) {
              shouldUpdate = true
            }
          }
        })
        if (prevScu) {
          const result = prevScu.call(this, p, s, c)
          return updatedHook ? result || shouldUpdate : result
        }
        return !updatedHook || shouldUpdate
      }
    }
  }
  return hookState._value
}
function useEffect(callback, args) {
  const state = getHookState(currentIndex++, 3)
  if (!options._skipEffects && argsChanged(state._args, args)) {
    state._passive = true
    state._value = callback
    state._pendingArgs = args
    currentComponent.__hooks._pendingEffects.push(state)
  }
}
function useLayoutEffect(callback, args) {
  const state = getHookState(currentIndex++, 4)
  if (!options._skipEffects && argsChanged(state._args, args)) {
    state._passive = false
    state._value = callback
    state._pendingArgs = args
    currentComponent._renderCallbacks.push(state)
  }
}
function useRef(initialValue) {
  currentHook = 5
  return useMemo(() => ({ current: initialValue }), [])
}
function useImperativeHandle(ref, createHandle, args) {
  currentHook = 6
  useLayoutEffect(
    () => {
      if (typeof ref == 'function') {
        const result = ref(createHandle())
        return () => {
          ref(null)
          if (result && typeof result == 'function') result()
        }
      } else if (ref) {
        ref.current = createHandle()
        return () => (ref.current = null)
      }
    },
    args == null ? args : args.concat(ref),
  )
}
function useMemo(factory, args) {
  const state = getHookState(currentIndex++, 7)
  if (argsChanged(state._args, args)) {
    state._value = factory()
    state._args = args
  }
  return state._value
}
function useCallback(callback, args) {
  currentHook = 8
  return useMemo(() => callback, args)
}
function useContext(context) {
  const provider = currentComponent.context[context._id]
  const state = getHookState(currentIndex++, 9)
  state._context = context
  if (!provider) return context._defaultValue
  if (state._value == null) {
    state._value = true
    provider.sub(currentComponent)
  }
  return provider.props.value
}
function useDebugValue(value, formatter) {
  if (options.useDebugValue) {
    options.useDebugValue(formatter ? formatter(value) : value)
  }
}
function useErrorBoundary(cb) {
  const state = getHookState(currentIndex++, 10)
  const errState = useState()
  state._value = cb
  if (!currentComponent.componentDidCatch) {
    currentComponent.componentDidCatch = (err, errorInfo) => {
      if (state._value) state._value(err, errorInfo)
      errState[1](err)
    }
  }
  return [
    errState[0],
    () => {
      errState[1](undefined)
    },
  ]
}
function useId() {
  const state = getHookState(currentIndex++, 11)
  if (!state._value) {
    let root = currentComponent._vnode
    while (!root._mask && root._parent) {
      root = root._parent
    }
    let mask = root._mask || (root._mask = [0, 0])
    state._value = 'P' + mask[0] + '-' + mask[1]++
  }
  return state._value
}
function flushAfterPaintEffects() {
  let component
  do {
    while ((component = unmountCleanups.shift())) {
      try {
        invokeCleanup(component)
      } catch (e) {
        component = component._passive
        options._catchError(e, { _parent: component && component._vnode })
      }
    }
    while ((component = afterPaintEffects.shift())) {
      const hooks = component.__hooks
      if (!component._parentDom || !hooks) continue
      try {
        hooks._pendingEffects.some(invokeCleanup)
        hooks._pendingEffects.some(invokeEffect)
        hooks._pendingEffects = []
      } catch (e) {
        hooks._pendingEffects = []
        options._catchError(e, component._vnode)
      }
    }
  } while (unmountCleanups.length)
}
let HAS_RAF = typeof requestAnimationFrame == 'function'
function afterNextFrame(callback) {
  const done = () => {
    clearTimeout(timeout)
    if (HAS_RAF) cancelAnimationFrame(raf)
    setTimeout(callback)
  }
  const timeout = setTimeout(done, RAF_TIMEOUT)
  let raf
  if (HAS_RAF) {
    raf = requestAnimationFrame(done)
  }
}
function afterPaint(newQueueLength) {
  if (newQueueLength == 1 || prevRaf != options.requestAnimationFrame) {
    prevRaf = options.requestAnimationFrame
    ;(prevRaf || afterNextFrame)(flushAfterPaintEffects)
  }
}
function invokeCleanup(hook) {
  const comp = currentComponent
  let cleanup = hook._cleanup
  if (typeof cleanup == 'function') {
    hook._cleanup = undefined
    cleanup()
  }
  currentComponent = comp
}
function invokeEffect(hook) {
  const comp = currentComponent
  hook._cleanup = hook._value()
  currentComponent = comp
}
function argsChanged(oldArgs, newArgs) {
  return (
    !oldArgs ||
    oldArgs.length != newArgs.length ||
    newArgs.some((arg, index) => !ObjectIs(arg, oldArgs[index]))
  )
}
function invokeOrReturn(arg, f) {
  return typeof f == 'function' ? f(arg) : f
}

const assign = Object.assign
function shallowDiffers(a, b) {
  for (let i in a) if (i != '__source' && a[i] !== b[i]) return true
  for (let i in b) if (i != '__source' && !(i in a)) return true
  return false
}
const IS_NON_DIMENSIONAL =
  /^(-|f[lo].*[^se]$|g.{5,}[^ps]$|z|o[pr]|(W.{5})?[lL]i.*(t|mp)$|an|(bo|s).{4}Im|sca|m.{6}[ds]|ta|c.*[st]$|wido|ini)/

function initSuspenseHooks() {
  const oldCatchError = options$1._catchError
  options$1._catchError = (error, newVNode, oldVNode, errorInfo) => {
    if (error.then) {
      let component
      let vnode = newVNode
      while ((vnode = vnode._parent)) {
        if ((component = vnode._component) && component._childDidSuspend) {
          if (oldVNode && !oldVNode._component) newVNode._component.__hooks = void 0
          return component._childDidSuspend(error, newVNode)
        }
      }
    }
    oldCatchError(error, newVNode, oldVNode, errorInfo)
  }
  const oldUnmount = options$1.unmount
  options$1.unmount = (vnode) => {
    const component = vnode._component
    if (component && component._onResolve) {
      component._onResolve()
    }
    if (oldUnmount) oldUnmount(vnode)
  }
}
function detachedClone(vnode, detachedParent, parentDom) {
  if (vnode) {
    const hooks = vnode._component && vnode._component.__hooks
    if (hooks) {
      hooks._list.forEach((effect) => {
        if (effect._passive != null) {
          if (typeof effect._cleanup == 'function') effect._cleanup()
          effect._cleanup = effect._args = void 0
        }
      })
      hooks._pendingEffects = vnode._component._renderCallbacks = []
    }
    if (typeof vnode.type == 'string') vnode._flags |= 8
    vnode = assign({ constructor: void 0 }, vnode)
    if (vnode._component != null) {
      if (vnode._component._parentDom == parentDom) {
        vnode._component._parentDom = detachedParent
      }
      vnode._component._bits |= 4
      vnode._component = vnode.ref = null
    }
    vnode._children =
      vnode._children &&
      vnode._children.map((child) => detachedClone(child, detachedParent, parentDom))
  }
  return vnode
}
function removeOriginal(vnode, detachedParent, originalParent) {
  if (vnode && originalParent) {
    if (typeof vnode.type == 'string') {
      vnode._flags |= 1
    }
    vnode._original = null
    vnode._children =
      vnode._children &&
      vnode._children.map((child) => removeOriginal(child, detachedParent, originalParent))
    if (vnode._component) {
      if (vnode._component._parentDom == detachedParent) {
        if (vnode._dom) {
          originalParent.appendChild(vnode._dom)
        }
        vnode._component._bits |= 4
        vnode._component._parentDom = originalParent
      }
    }
  }
  return vnode
}
function createSuspense() {
  initSuspenseHooks()
  function Suspense() {
    this._pendingSuspensionCount = 0
    this._suspenders = null
    this._detachOnNextRender = null
  }
  Suspense.prototype = new BaseComponent()
  Suspense.prototype._childDidSuspend = function (promise, suspendingVNode) {
    const suspendingComponent = suspendingVNode._component
    if (this._suspenders == null) {
      this._suspenders = []
    }
    this._suspenders.push(suspendingComponent)
    let resolved = false
    const onResolved = () => {
      if (resolved || !this._parentDom) return
      resolved = true
      suspendingComponent._onResolve = null
      onSuspensionComplete()
    }
    suspendingComponent._onResolve = onResolved
    const originalParentDom = suspendingComponent._parentDom
    suspendingComponent._parentDom = null
    const onSuspensionComplete = () => {
      if (!--this._pendingSuspensionCount) {
        if (this.state._suspended) {
          const suspendedVNode = this.state._suspended
          this._vnode._children[0] = removeOriginal(
            suspendedVNode,
            suspendedVNode._component._parentDom,
            suspendedVNode._component._originalParentDom,
          )
        }
        this.setState({ _suspended: (this._detachOnNextRender = null) })
        let suspended
        while ((suspended = this._suspenders.pop())) {
          suspended._parentDom = originalParentDom
          suspended.forceUpdate()
        }
      }
    }
    if (!this._pendingSuspensionCount++ && !(suspendingVNode._flags & 32)) {
      this.setState({
        _suspended: (this._detachOnNextRender = this._vnode._children[0]),
      })
    }
    promise.then(onResolved, onResolved)
  }
  Suspense.prototype.componentWillUnmount = function () {
    this._suspenders = []
    if (this.state._suspended) this._vnode._children[0] = this.state._suspended
  }
  Suspense.prototype.render = function (props, state) {
    if (this._detachOnNextRender) {
      if (this._vnode._children) {
        const detachedParent = document.createElement('div')
        const detachedComponent = this._vnode._children[0]._component
        this._vnode._children[0] = detachedClone(
          this._detachOnNextRender,
          detachedParent,
          (detachedComponent._originalParentDom = detachedComponent._parentDom),
        )
      }
      this._detachOnNextRender = null
    }
    return [
      createElement(Fragment, null, state._suspended ? null : props.children),
      state._suspended && createElement(Fragment, null, props.fallback),
    ]
  }
  return Suspense
}
const Suspense = createSuspense()
function lazy(loader) {
  let prom
  let component = null
  let error
  let resolved
  function Lazy(props) {
    if (!prom) {
      prom = loader()
      prom.then(
        (exports) => {
          if (exports) {
            component = exports.default || exports
          }
          resolved = true
        },
        (e) => {
          error = e
          resolved = true
        },
      )
    }
    if (error) {
      throw error
    }
    if (!resolved) {
      throw prom
    }
    return component ? createElement(component, props) : null
  }
  Lazy.displayName = 'Lazy'
  return Lazy
}

function initDevTools() {
  const globalVar =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof window !== 'undefined'
        ? window
        : undefined
  if (globalVar !== null && globalVar !== undefined && globalVar.__PREACT_DEVTOOLS__) {
    globalVar.__PREACT_DEVTOOLS__.attachPreact('11.0.0', options$1, {
      Fragment,
      Component: BaseComponent,
    })
  }
}

initDevTools()
function addHookName(value, name) {
  if (options$1._addHookName) {
    options$1._addHookName(name)
  }
  return value
}

const ENCODED_ENTITIES = /["&<]/
function encodeEntities(str) {
  if (!str.length || !ENCODED_ENTITIES.test(str)) return str
  let last = 0,
    i = 0,
    out = '',
    ch = ''
  for (; i < str.length; i++) {
    switch (str.charCodeAt(i)) {
      case 34:
        ch = '&quot;'
        break
      case 38:
        ch = '&amp;'
        break
      case 60:
        ch = '&lt;'
        break
      default:
        continue
    }
    if (i != last) out += str.slice(last, i)
    out += ch
    last = i + 1
  }
  if (i != last) out += str.slice(last, i)
  return out
}

let vnodeId = 0
const isArray = Array.isArray
function createVNode(type, props, key, isStaticChildren, __source, __self) {
  if (!props) props = {}
  let normalizedProps = props,
    ref,
    i
  if ('ref' in normalizedProps && typeof type != 'function') {
    normalizedProps = {}
    for (i in props) {
      if (i == 'ref') {
        ref = props[i]
      } else {
        normalizedProps[i] = props[i]
      }
    }
  }
  const vnode = {
    type,
    props: normalizedProps,
    key,
    ref,
    _children: null,
    _parent: null,
    _depth: 0,
    _dom: null,
    _component: null,
    constructor: undefined,
    _original: --vnodeId,
    _index: -1,
    _flags: 0,
  }
  if (__source || __self) {
    vnode.__source = __source
    vnode.__self = __self
  }
  if (options$1.vnode) options$1.vnode(vnode)
  return vnode
}
function jsxTemplate(templates, ...exprs) {
  const vnode = createVNode(Fragment, {
    tpl: templates,
    exprs,
  })
  vnode.key = vnode._vnode
  return vnode
}
const JS_TO_CSS = {}
const CSS_REGEX = /[A-Z]/g
function normalizeAttrValue(value) {
  return value != null && typeof value == 'object' && typeof value.valueOf == 'function'
    ? value.valueOf()
    : value
}
function jsxAttr(name, value) {
  if (options$1.attr) {
    const result = options$1.attr(name, value)
    if (typeof result == 'string') return result
  }
  value = normalizeAttrValue(value)
  if (name == 'ref' || name == 'key') return ''
  if (name == 'style' && typeof value == 'object') {
    let str = ''
    for (let prop in value) {
      let val = value[prop]
      if (val != null && val !== '') {
        const name =
          prop[0] == '-'
            ? prop
            : JS_TO_CSS[prop] || (JS_TO_CSS[prop] = prop.replace(CSS_REGEX, '-$&').toLowerCase())
        str = str + name + ':' + val + ';'
      }
    }
    return name + '="' + encodeEntities(str) + '"'
  }
  if (value == null || value === false || typeof value == 'function' || typeof value == 'object') {
    return ''
  } else if (value === true) return name
  return name + '="' + encodeEntities('' + value) + '"'
}
function jsxEscape(value) {
  if (value == null || typeof value == 'boolean' || typeof value == 'function') {
    return null
  }
  if (typeof value == 'object') {
    if (value.constructor === undefined) return value
    if (isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        value[i] = jsxEscape(value[i])
      }
      return value
    }
  }
  return encodeEntities('' + value)
}

class Counter extends BaseComponent {
  state = { count: 0 }
  increment = () => {
    this.setState({ count: this.state.count + 1 })
    this.setState({ count: this.state.count + 1 })
  }
  render() {
    return createVNode('div', {
      children: [
        createVNode('h1', {
          children: ['Class Component Count: ', this.state.count],
        }),
        createVNode('button', {
          onClick: this.increment,
          children: 'Increment',
        }),
      ],
    })
  }
}
function CounterFunction() {
  const [count, setCount] = useState(0)
  useEffect(() => {
    console.log('[CounterFunction] useEffect:', count)
  }, [count])
  useLayoutEffect(() => {
    console.log('[CounterFunction] useLayoutEffect:', count)
  }, [count])
  const increment = () => setCount(count + 1)
  return createVNode('div', {
    children: [
      createVNode('h1', { children: ['Function Component Count: ', count] }),
      createVNode('button', {
        onClick: increment,
        children: 'Increment',
      }),
    ],
  })
}
function Greeting() {
  return createVNode('h1', { children: 'Lazy Component Loaded' })
}
const LazyGreeting = lazy(
  () =>
    new Promise((resolve) => {
      setTimeout(() => resolve({ default: Greeting }), 1e3)
    }),
)
render(
  createVNode('div', {
    children: [
      createVNode(Counter, {}),
      createVNode(CounterFunction, {}),
      createVNode(Suspense, {
        fallback: createVNode('h1', { children: 'Loading...' }),
        children: createVNode(LazyGreeting, {}),
      }),
    ],
  }),
  document.getElementById('app'),
)
