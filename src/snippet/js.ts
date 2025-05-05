export const preact: string = `const EMPTY_OBJ = {};
const EMPTY_ARR = [];
const IS_NON_DIMENSIONAL =
	/acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;

const isArray = Array.isArray;
function assign(obj, props) {
	for (let i in props) obj[i] = props[i];
	return  (obj);
}
function removeNode(node) {
	let parentNode = node.parentNode;
	if (parentNode) parentNode.removeChild(node);
}
const slice = EMPTY_ARR.slice;

function _catchError(error, vnode, oldVNode, errorInfo) {
	let component, ctor, handled;
	for (; (vnode = vnode._parent); ) {
		if ((component = vnode._component) && !component._processingException) {
			try {
				ctor = component.constructor;
				if (ctor && ctor.getDerivedStateFromError != null) {
					component.setState(ctor.getDerivedStateFromError(error));
					handled = component._dirty;
				}
				if (component.componentDidCatch != null) {
					component.componentDidCatch(error, errorInfo || {});
					handled = component._dirty;
				}
				if (handled) {
					return (component._pendingError = component);
				}
			} catch (e) {
				error = e;
			}
		}
	}
	throw error;
}

const options = {
	_catchError
};

let vnodeId$1 = 0;
function createElement(type, props, children) {
	let normalizedProps = {},
		key,
		ref,
		i;
	for (i in props) {
		if (i == 'key') key = props[i];
		else if (i == 'ref') ref = props[i];
		else normalizedProps[i] = props[i];
	}
	if (arguments.length > 2) {
		normalizedProps.children =
			arguments.length > 3 ? slice.call(arguments, 2) : children;
	}
	if (typeof type == 'function' && type.defaultProps != null) {
		for (i in type.defaultProps) {
			if (normalizedProps[i] === undefined) {
				normalizedProps[i] = type.defaultProps[i];
			}
		}
	}
	return createVNode$1(type, normalizedProps, key, ref, null);
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
		_nextDom: undefined,
		_component: null,
		_hydrating: null,
		constructor: undefined,
		_original: original == null ? ++vnodeId$1 : original
	};
	if (original == null && options.vnode != null) options.vnode(vnode);
	return vnode;
}
function Fragment(props) {
	return props.children;
}

function Component(props, context) {
	this.props = props;
	this.context = context;
}
Component.prototype.setState = function (update, callback) {
	let s;
	if (this._nextState != null && this._nextState !== this.state) {
		s = this._nextState;
	} else {
		s = this._nextState = assign({}, this.state);
	}
	if (typeof update == 'function') {
		update = update(assign({}, s), this.props);
	}
	if (update) {
		assign(s, update);
	}
	if (update == null) return;
	if (this._vnode) {
		if (callback) {
			this._stateCallbacks.push(callback);
		}
		enqueueRender(this);
	}
};
Component.prototype.forceUpdate = function (callback) {
	if (this._vnode) {
		this._force = true;
		if (callback) this._renderCallbacks.push(callback);
		enqueueRender(this);
	}
};
Component.prototype.render = Fragment;
function getDomSibling(vnode, childIndex) {
	if (childIndex == null) {
		return vnode._parent
			? getDomSibling(vnode._parent, vnode._parent._children.indexOf(vnode) + 1)
			: null;
	}
	let sibling;
	for (; childIndex < vnode._children.length; childIndex++) {
		sibling = vnode._children[childIndex];
		if (sibling != null && sibling._dom != null) {
			return sibling._dom;
		}
	}
	return typeof vnode.type == 'function' ? getDomSibling(vnode) : null;
}
function renderComponent(component) {
	let vnode = component._vnode,
		oldDom = vnode._dom,
		parentDom = component._parentDom;
	if (parentDom) {
		let commitQueue = [],
			refQueue = [];
		const oldVNode = assign({}, vnode);
		oldVNode._original = vnode._original + 1;
		diff(
			parentDom,
			vnode,
			oldVNode,
			component._globalContext,
			parentDom.ownerSVGElement !== undefined,
			vnode._hydrating != null ? [oldDom] : null,
			commitQueue,
			oldDom == null ? getDomSibling(vnode) : oldDom,
			vnode._hydrating,
			refQueue
		);
		commitRoot(commitQueue, vnode, refQueue);
		if (vnode._dom != oldDom) {
			updateParentDomPointers(vnode);
		}
	}
}
function updateParentDomPointers(vnode) {
	if ((vnode = vnode._parent) != null && vnode._component != null) {
		vnode._dom = vnode._component.base = null;
		for (let i = 0; i < vnode._children.length; i++) {
			let child = vnode._children[i];
			if (child != null && child._dom != null) {
				vnode._dom = vnode._component.base = child._dom;
				break;
			}
		}
		return updateParentDomPointers(vnode);
	}
}
let rerenderQueue = [];
let prevDebounce;
const defer =
	typeof Promise == 'function'
		? Promise.prototype.then.bind(Promise.resolve())
		: setTimeout;
function enqueueRender(c) {
	if (
		(!c._dirty &&
			(c._dirty = true) &&
			rerenderQueue.push(c) &&
			!process._rerenderCount++) ||
		prevDebounce !== options.debounceRendering
	) {
		prevDebounce = options.debounceRendering;
		(prevDebounce || defer)(process);
	}
}
const depthSort = (a, b) => a._vnode._depth - b._vnode._depth;
function process() {
	let c;
	rerenderQueue.sort(depthSort);
	while ((c = rerenderQueue.shift())) {
		if (c._dirty) {
			let renderQueueLength = rerenderQueue.length;
			renderComponent(c);
			if (rerenderQueue.length > renderQueueLength) {
				rerenderQueue.sort(depthSort);
			}
		}
	}
	process._rerenderCount = 0;
}
process._rerenderCount = 0;

function diffChildren(
	parentDom,
	renderResult,
	newParentVNode,
	oldParentVNode,
	globalContext,
	isSvg,
	excessDomChildren,
	commitQueue,
	oldDom,
	isHydrating,
	refQueue
) {
	let i,
		j,
		oldVNode,
		childVNode,
		newDom,
		firstChildDom,
		skew = 0;
	let oldChildren = (oldParentVNode && oldParentVNode._children) || EMPTY_ARR;
	let oldChildrenLength = oldChildren.length,
		remainingOldChildren = oldChildrenLength,
		newChildrenLength = renderResult.length;
	newParentVNode._children = [];
	for (i = 0; i < newChildrenLength; i++) {
		childVNode = renderResult[i];
		if (
			childVNode == null ||
			typeof childVNode == 'boolean' ||
			typeof childVNode == 'function'
		) {
			childVNode = newParentVNode._children[i] = null;
		}
		else if (
			typeof childVNode == 'string' ||
			typeof childVNode == 'number' ||
			typeof childVNode == 'bigint'
		) {
			childVNode = newParentVNode._children[i] = createVNode$1(
				null,
				childVNode,
				null,
				null,
				childVNode
			);
		} else if (isArray(childVNode)) {
			childVNode = newParentVNode._children[i] = createVNode$1(
				Fragment,
				{ children: childVNode },
				null,
				null,
				null
			);
		} else if (childVNode._depth > 0) {
			childVNode = newParentVNode._children[i] = createVNode$1(
				childVNode.type,
				childVNode.props,
				childVNode.key,
				childVNode.ref ? childVNode.ref : null,
				childVNode._original
			);
		} else {
			childVNode = newParentVNode._children[i] = childVNode;
		}
		if (childVNode == null) {
			oldVNode = oldChildren[i];
			if (oldVNode && oldVNode.key == null && oldVNode._dom) {
				if (oldVNode._dom == oldDom) {
					oldDom = getDomSibling(oldVNode);
				}
				unmount(oldVNode, oldVNode, false);
			}
			continue;
		}
		childVNode._parent = newParentVNode;
		childVNode._depth = newParentVNode._depth + 1;
		let skewedIndex = i + skew;
		const matchingIndex = findMatchingIndex(
			childVNode,
			oldChildren,
			skewedIndex,
			remainingOldChildren
		);
		if (matchingIndex === -1) {
			oldVNode = EMPTY_OBJ;
		} else {
			oldVNode = oldChildren[matchingIndex] || EMPTY_OBJ;
			oldChildren[matchingIndex] = undefined;
			remainingOldChildren--;
		}
		diff(
			parentDom,
			childVNode,
			oldVNode,
			globalContext,
			isSvg,
			excessDomChildren,
			commitQueue,
			oldDom,
			isHydrating,
			refQueue
		);
		newDom = childVNode._dom;
		if ((j = childVNode.ref) && oldVNode.ref != j) {
			if (oldVNode.ref) {
				applyRef(oldVNode.ref, null, childVNode);
			}
			refQueue.push(j, childVNode._component || newDom, childVNode);
		}
		if (newDom != null) {
			if (firstChildDom == null) {
				firstChildDom = newDom;
			}
			let isMounting = oldVNode === EMPTY_OBJ || oldVNode._original === null;
			if (isMounting) {
				if (matchingIndex == -1) {
					skew--;
				}
			} else if (matchingIndex !== skewedIndex) {
				if (matchingIndex === skewedIndex + 1) {
					skew++;
				} else if (matchingIndex > skewedIndex) {
					if (remainingOldChildren > newChildrenLength - skewedIndex) {
						skew += matchingIndex - skewedIndex;
					} else {
						skew--;
					}
				} else if (matchingIndex < skewedIndex) {
					if (matchingIndex == skewedIndex - 1) {
						skew = matchingIndex - skewedIndex;
					} else {
						skew = 0;
					}
				} else {
					skew = 0;
				}
			}
			skewedIndex = i + skew;
			if (
				typeof childVNode.type == 'function' &&
				(matchingIndex !== skewedIndex ||
					oldVNode._children === childVNode._children)
			) {
				oldDom = reorderChildren(childVNode, oldDom, parentDom);
			} else if (
				typeof childVNode.type != 'function' &&
				(matchingIndex !== skewedIndex || isMounting)
			) {
				oldDom = placeChild(parentDom, newDom, oldDom);
			} else if (childVNode._nextDom !== undefined) {
				oldDom = childVNode._nextDom;
				childVNode._nextDom = undefined;
			} else {
				oldDom = newDom.nextSibling;
			}
			if (typeof newParentVNode.type == 'function') {
				newParentVNode._nextDom = oldDom;
			}
		}
	}
	newParentVNode._dom = firstChildDom;
	for (i = oldChildrenLength; i--; ) {
		if (oldChildren[i] != null) {
			if (
				typeof newParentVNode.type == 'function' &&
				oldChildren[i]._dom != null &&
				oldChildren[i]._dom == newParentVNode._nextDom
			) {
				newParentVNode._nextDom = oldChildren[i]._dom.nextSibling;
			}
			unmount(oldChildren[i], oldChildren[i]);
		}
	}
}
function reorderChildren(childVNode, oldDom, parentDom) {
	let c = childVNode._children;
	let tmp = 0;
	for (; c && tmp < c.length; tmp++) {
		let vnode = c[tmp];
		if (vnode) {
			vnode._parent = childVNode;
			if (typeof vnode.type == 'function') {
				oldDom = reorderChildren(vnode, oldDom, parentDom);
			} else {
				oldDom = placeChild(parentDom, vnode._dom, oldDom);
			}
		}
	}
	return oldDom;
}
function placeChild(parentDom, newDom, oldDom) {
	if (oldDom == null || oldDom.parentNode !== parentDom) {
		parentDom.insertBefore(newDom, null);
	} else if (newDom != oldDom || newDom.parentNode == null) {
		parentDom.insertBefore(newDom, oldDom);
	}
	return newDom.nextSibling;
}
function findMatchingIndex(
	childVNode,
	oldChildren,
	skewedIndex,
	remainingOldChildren
) {
	const key = childVNode.key;
	const type = childVNode.type;
	let x = skewedIndex - 1;
	let y = skewedIndex + 1;
	let oldVNode = oldChildren[skewedIndex];
	if (
		oldVNode === null ||
		(oldVNode && key == oldVNode.key && type === oldVNode.type)
	) {
		return skewedIndex;
	} else if (remainingOldChildren > (oldVNode != null ? 1 : 0)) {
		while (x >= 0 || y < oldChildren.length) {
			if (x >= 0) {
				oldVNode = oldChildren[x];
				if (oldVNode && key == oldVNode.key && type === oldVNode.type) {
					return x;
				}
				x--;
			}
			if (y < oldChildren.length) {
				oldVNode = oldChildren[y];
				if (oldVNode && key == oldVNode.key && type === oldVNode.type) {
					return y;
				}
				y++;
			}
		}
	}
	return -1;
}

function diffProps(dom, newProps, oldProps, isSvg, hydrate) {
	let i;
	for (i in oldProps) {
		if (i !== 'children' && i !== 'key' && !(i in newProps)) {
			setProperty(dom, i, null, oldProps[i], isSvg);
		}
	}
	for (i in newProps) {
		if (
			(!hydrate || typeof newProps[i] == 'function') &&
			i !== 'children' &&
			i !== 'key' &&
			i !== 'value' &&
			i !== 'checked' &&
			oldProps[i] !== newProps[i]
		) {
			setProperty(dom, i, newProps[i], oldProps[i], isSvg);
		}
	}
}
function setStyle(style, key, value) {
	if (key[0] === '-') {
		style.setProperty(key, value == null ? '' : value);
	} else if (value == null) {
		style[key] = '';
	} else if (typeof value != 'number' || IS_NON_DIMENSIONAL.test(key)) {
		style[key] = value;
	} else {
		style[key] = value + 'px';
	}
}
function setProperty(dom, name, value, oldValue, isSvg) {
	let useCapture;
	o: if (name === 'style') {
		if (typeof value == 'string') {
			dom.style.cssText = value;
		} else {
			if (typeof oldValue == 'string') {
				dom.style.cssText = oldValue = '';
			}
			if (oldValue) {
				for (name in oldValue) {
					if (!(value && name in value)) {
						setStyle(dom.style, name, '');
					}
				}
			}
			if (value) {
				for (name in value) {
					if (!oldValue || value[name] !== oldValue[name]) {
						setStyle(dom.style, name, value[name]);
					}
				}
			}
		}
	}
	else if (name[0] === 'o' && name[1] === 'n') {
		useCapture = name !== (name = name.replace(/Capture$/, ''));
		if (name.toLowerCase() in dom) name = name.toLowerCase().slice(2);
		else name = name.slice(2);
		if (!dom._listeners) dom._listeners = {};
		dom._listeners[name + useCapture] = value;
		if (value) {
			if (!oldValue) {
				const handler = useCapture ? eventProxyCapture : eventProxy;
				dom.addEventListener(name, handler, useCapture);
			}
		} else {
			const handler = useCapture ? eventProxyCapture : eventProxy;
			dom.removeEventListener(name, handler, useCapture);
		}
	} else if (name !== 'dangerouslySetInnerHTML') {
		if (isSvg) {
			name = name.replace(/xlink(H|:h)/, 'h').replace(/sName$/, 's');
		} else if (
			name !== 'width' &&
			name !== 'height' &&
			name !== 'href' &&
			name !== 'list' &&
			name !== 'form' &&
			name !== 'tabIndex' &&
			name !== 'download' &&
			name !== 'rowSpan' &&
			name !== 'colSpan' &&
			name in dom
		) {
			try {
				dom[name] = value == null ? '' : value;
				break o;
			} catch (e) {}
		}
		if (typeof value === 'function') ; else if (value != null && (value !== false || name[4] === '-')) {
			dom.setAttribute(name, value);
		} else {
			dom.removeAttribute(name);
		}
	}
}
function eventProxy(e) {
	return this._listeners[e.type + false](options.event ? options.event(e) : e);
}
function eventProxyCapture(e) {
	return this._listeners[e.type + true](options.event ? options.event(e) : e);
}

function diff(
	parentDom,
	newVNode,
	oldVNode,
	globalContext,
	isSvg,
	excessDomChildren,
	commitQueue,
	oldDom,
	isHydrating,
	refQueue
) {
	let tmp,
		newType = newVNode.type;
	if (newVNode.constructor !== undefined) return null;
	if (oldVNode._hydrating != null) {
		isHydrating = oldVNode._hydrating;
		oldDom = newVNode._dom = oldVNode._dom;
		newVNode._hydrating = null;
		excessDomChildren = [oldDom];
	}
	if ((tmp = options._diff)) tmp(newVNode);
	outer: if (typeof newType == 'function') {
		try {
			let c, isNew, oldProps, oldState, snapshot, clearProcessingException;
			let newProps = newVNode.props;
			tmp = newType.contextType;
			let provider = tmp && globalContext[tmp._id];
			let componentContext = tmp
				? provider
					? provider.props.value
					: tmp._defaultValue
				: globalContext;
			if (oldVNode._component) {
				c = newVNode._component = oldVNode._component;
				clearProcessingException = c._processingException = c._pendingError;
			} else {
				if ('prototype' in newType && newType.prototype.render) {
					newVNode._component = c = new newType(newProps, componentContext);
				} else {
					newVNode._component = c = new Component(newProps, componentContext);
					c.constructor = newType;
					c.render = doRender;
				}
				if (provider) provider.sub(c);
				c.props = newProps;
				if (!c.state) c.state = {};
				c.context = componentContext;
				c._globalContext = globalContext;
				isNew = c._dirty = true;
				c._renderCallbacks = [];
				c._stateCallbacks = [];
			}
			if (c._nextState == null) {
				c._nextState = c.state;
			}
			if (newType.getDerivedStateFromProps != null) {
				if (c._nextState == c.state) {
					c._nextState = assign({}, c._nextState);
				}
				assign(
					c._nextState,
					newType.getDerivedStateFromProps(newProps, c._nextState)
				);
			}
			oldProps = c.props;
			oldState = c.state;
			c._vnode = newVNode;
			if (isNew) {
				if (
					newType.getDerivedStateFromProps == null &&
					c.componentWillMount != null
				) {
					c.componentWillMount();
				}
				if (c.componentDidMount != null) {
					c._renderCallbacks.push(c.componentDidMount);
				}
			} else {
				if (
					newType.getDerivedStateFromProps == null &&
					newProps !== oldProps &&
					c.componentWillReceiveProps != null
				) {
					c.componentWillReceiveProps(newProps, componentContext);
				}
				if (
					!c._force &&
					((c.shouldComponentUpdate != null &&
						c.shouldComponentUpdate(
							newProps,
							c._nextState,
							componentContext
						) === false) ||
						newVNode._original === oldVNode._original)
				) {
					if (newVNode._original !== oldVNode._original) {
						c.props = newProps;
						c.state = c._nextState;
						c._dirty = false;
					}
					newVNode._dom = oldVNode._dom;
					newVNode._children = oldVNode._children;
					newVNode._children.forEach(vnode => {
						if (vnode) vnode._parent = newVNode;
					});
					for (let i = 0; i < c._stateCallbacks.length; i++) {
						c._renderCallbacks.push(c._stateCallbacks[i]);
					}
					c._stateCallbacks = [];
					if (c._renderCallbacks.length) {
						commitQueue.push(c);
					}
					break outer;
				}
				if (c.componentWillUpdate != null) {
					c.componentWillUpdate(newProps, c._nextState, componentContext);
				}
				if (c.componentDidUpdate != null) {
					c._renderCallbacks.push(() => {
						c.componentDidUpdate(oldProps, oldState, snapshot);
					});
				}
			}
			c.context = componentContext;
			c.props = newProps;
			c._parentDom = parentDom;
			c._force = false;
			let renderHook = options._render,
				count = 0;
			if ('prototype' in newType && newType.prototype.render) {
				c.state = c._nextState;
				c._dirty = false;
				if (renderHook) renderHook(newVNode);
				tmp = c.render(c.props, c.state, c.context);
				for (let i = 0; i < c._stateCallbacks.length; i++) {
					c._renderCallbacks.push(c._stateCallbacks[i]);
				}
				c._stateCallbacks = [];
			} else {
				do {
					c._dirty = false;
					if (renderHook) renderHook(newVNode);
					tmp = c.render(c.props, c.state, c.context);
					c.state = c._nextState;
				} while (c._dirty && ++count < 25);
			}
			c.state = c._nextState;
			if (c.getChildContext != null) {
				globalContext = assign(assign({}, globalContext), c.getChildContext());
			}
			if (!isNew && c.getSnapshotBeforeUpdate != null) {
				snapshot = c.getSnapshotBeforeUpdate(oldProps, oldState);
			}
			let isTopLevelFragment =
				tmp != null && tmp.type === Fragment && tmp.key == null;
			let renderResult = isTopLevelFragment ? tmp.props.children : tmp;
			diffChildren(
				parentDom,
				isArray(renderResult) ? renderResult : [renderResult],
				newVNode,
				oldVNode,
				globalContext,
				isSvg,
				excessDomChildren,
				commitQueue,
				oldDom,
				isHydrating,
				refQueue
			);
			c.base = newVNode._dom;
			newVNode._hydrating = null;
			if (c._renderCallbacks.length) {
				commitQueue.push(c);
			}
			if (clearProcessingException) {
				c._pendingError = c._processingException = null;
			}
		} catch (e) {
			newVNode._original = null;
			if (isHydrating || excessDomChildren != null) {
				newVNode._dom = oldDom;
				newVNode._hydrating = !!isHydrating;
				excessDomChildren[excessDomChildren.indexOf(oldDom)] = null;
			}
			options._catchError(e, newVNode, oldVNode);
		}
	} else if (
		excessDomChildren == null &&
		newVNode._original === oldVNode._original
	) {
		newVNode._children = oldVNode._children;
		newVNode._dom = oldVNode._dom;
	} else {
		newVNode._dom = diffElementNodes(
			oldVNode._dom,
			newVNode,
			oldVNode,
			globalContext,
			isSvg,
			excessDomChildren,
			commitQueue,
			isHydrating,
			refQueue
		);
	}
	if ((tmp = options.diffed)) tmp(newVNode);
}
function commitRoot(commitQueue, root, refQueue) {
	for (let i = 0; i < refQueue.length; i++) {
		applyRef(refQueue[i], refQueue[++i], refQueue[++i]);
	}
	if (options._commit) options._commit(root, commitQueue);
	commitQueue.some(c => {
		try {
			commitQueue = c._renderCallbacks;
			c._renderCallbacks = [];
			commitQueue.some(cb => {
				cb.call(c);
			});
		} catch (e) {
			options._catchError(e, c._vnode);
		}
	});
}
function diffElementNodes(
	dom,
	newVNode,
	oldVNode,
	globalContext,
	isSvg,
	excessDomChildren,
	commitQueue,
	isHydrating,
	refQueue
) {
	let oldProps = oldVNode.props;
	let newProps = newVNode.props;
	let nodeType = newVNode.type;
	let i = 0;
	if (nodeType === 'svg') isSvg = true;
	if (excessDomChildren != null) {
		for (; i < excessDomChildren.length; i++) {
			const child = excessDomChildren[i];
			if (
				child &&
				'setAttribute' in child === !!nodeType &&
				(nodeType ? child.localName === nodeType : child.nodeType === 3)
			) {
				dom = child;
				excessDomChildren[i] = null;
				break;
			}
		}
	}
	if (dom == null) {
		if (nodeType === null) {
			return document.createTextNode(newProps);
		}
		if (isSvg) {
			dom = document.createElementNS(
				'http://www.w3.org/2000/svg',
				nodeType
			);
		} else {
			dom = document.createElement(
				nodeType,
				newProps.is && newProps
			);
		}
		excessDomChildren = null;
		isHydrating = false;
	}
	if (nodeType === null) {
		if (oldProps !== newProps && (!isHydrating || dom.data !== newProps)) {
			dom.data = newProps;
		}
	} else {
		excessDomChildren = excessDomChildren && slice.call(dom.childNodes);
		oldProps = oldVNode.props || EMPTY_OBJ;
		let oldHtml = oldProps.dangerouslySetInnerHTML;
		let newHtml = newProps.dangerouslySetInnerHTML;
		if (!isHydrating) {
			if (excessDomChildren != null) {
				oldProps = {};
				for (i = 0; i < dom.attributes.length; i++) {
					oldProps[dom.attributes[i].name] = dom.attributes[i].value;
				}
			}
			if (newHtml || oldHtml) {
				if (
					!newHtml ||
					((!oldHtml || newHtml.__html != oldHtml.__html) &&
						newHtml.__html !== dom.innerHTML)
				) {
					dom.innerHTML = (newHtml && newHtml.__html) || '';
				}
			}
		}
		diffProps(dom, newProps, oldProps, isSvg, isHydrating);
		if (newHtml) {
			newVNode._children = [];
		} else {
			i = newVNode.props.children;
			diffChildren(
				dom,
				isArray(i) ? i : [i],
				newVNode,
				oldVNode,
				globalContext,
				isSvg && nodeType !== 'foreignObject',
				excessDomChildren,
				commitQueue,
				excessDomChildren
					? excessDomChildren[0]
					: oldVNode._children && getDomSibling(oldVNode, 0),
				isHydrating,
				refQueue
			);
			if (excessDomChildren != null) {
				for (i = excessDomChildren.length; i--; ) {
					if (excessDomChildren[i] != null) removeNode(excessDomChildren[i]);
				}
			}
		}
		if (!isHydrating) {
			if (
				'value' in newProps &&
				(i = newProps.value) !== undefined &&
				(i !== dom.value ||
					(nodeType === 'progress' && !i) ||
					(nodeType === 'option' && i !== oldProps.value))
			) {
				setProperty(dom, 'value', i, oldProps.value, false);
			}
			if (
				'checked' in newProps &&
				(i = newProps.checked) !== undefined &&
				i !== dom.checked
			) {
				setProperty(dom, 'checked', i, oldProps.checked, false);
			}
		}
	}
	return dom;
}
function applyRef(ref, value, vnode) {
	try {
		if (typeof ref == 'function') ref(value);
		else ref.current = value;
	} catch (e) {
		options._catchError(e, vnode);
	}
}
function unmount(vnode, parentVNode, skipRemove) {
	let r;
	if (options.unmount) options.unmount(vnode);
	if ((r = vnode.ref)) {
		if (!r.current || r.current === vnode._dom) {
			applyRef(r, null, parentVNode);
		}
	}
	if ((r = vnode._component) != null) {
		if (r.componentWillUnmount) {
			try {
				r.componentWillUnmount();
			} catch (e) {
				options._catchError(e, parentVNode);
			}
		}
		r.base = r._parentDom = null;
		vnode._component = undefined;
	}
	if ((r = vnode._children)) {
		for (let i = 0; i < r.length; i++) {
			if (r[i]) {
				unmount(
					r[i],
					parentVNode,
					skipRemove || typeof vnode.type !== 'function'
				);
			}
		}
	}
	if (!skipRemove && vnode._dom != null) {
		removeNode(vnode._dom);
	}
	vnode._parent = vnode._dom = vnode._nextDom = undefined;
}
function doRender(props, state, context) {
	return this.constructor(props, context);
}

function render(vnode, parentDom, replaceNode) {
	if (options._root) options._root(vnode, parentDom);
	let isHydrating = typeof replaceNode === 'function';
	let oldVNode = isHydrating
		? null
		: (replaceNode && replaceNode._children) || parentDom._children;
	vnode = ((!isHydrating && replaceNode) || parentDom)._children =
		createElement(Fragment, null, [vnode]);
	let commitQueue = [],
		refQueue = [];
	diff(
		parentDom,
		vnode,
		oldVNode || EMPTY_OBJ,
		EMPTY_OBJ,
		parentDom.ownerSVGElement !== undefined,
		!isHydrating && replaceNode
			? [replaceNode]
			: oldVNode
			? null
			: parentDom.firstChild
			? slice.call(parentDom.childNodes)
			: null,
		commitQueue,
		!isHydrating && replaceNode
			? replaceNode
			: oldVNode
			? oldVNode._dom
			: parentDom.firstChild,
		isHydrating,
		refQueue
	);
	commitRoot(commitQueue, vnode, refQueue);
}

let vnodeId = 0;
function createVNode(type, props, key, isStaticChildren, __source, __self) {
	let normalizedProps = {},
		ref,
		i;
	for (i in props) {
		if (i == 'ref') {
			ref = props[i];
		} else {
			normalizedProps[i] = props[i];
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
		_nextDom: undefined,
		_component: null,
		_hydrating: null,
		constructor: undefined,
		_original: --vnodeId,
		__source,
		__self
	};
	if (typeof type === 'function' && (ref = type.defaultProps)) {
		for (i in ref)
			if (typeof normalizedProps[i] === 'undefined') {
				normalizedProps[i] = ref[i];
			}
	}
	if (options.vnode) options.vnode(vnode);
	return vnode;
}

let currentIndex;
let currentComponent;
let previousComponent;
let currentHook = 0;
let afterPaintEffects = [];
let EMPTY = [];
let oldBeforeDiff = options._diff;
let oldBeforeRender = options._render;
let oldAfterDiff = options.diffed;
let oldCommit = options._commit;
let oldBeforeUnmount = options.unmount;
const RAF_TIMEOUT = 100;
let prevRaf;
options._diff = vnode => {
	currentComponent = null;
	if (oldBeforeDiff) oldBeforeDiff(vnode);
};
options._render = vnode => {
	if (oldBeforeRender) oldBeforeRender(vnode);
	currentComponent = vnode._component;
	currentIndex = 0;
	const hooks = currentComponent.__hooks;
	if (hooks) {
		if (previousComponent === currentComponent) {
			hooks._pendingEffects = [];
			currentComponent._renderCallbacks = [];
			hooks._list.forEach(hookItem => {
				if (hookItem._nextValue) {
					hookItem._value = hookItem._nextValue;
				}
				hookItem._pendingValue = EMPTY;
				hookItem._nextValue = hookItem._pendingArgs = undefined;
			});
		} else {
			hooks._pendingEffects.forEach(invokeCleanup);
			hooks._pendingEffects.forEach(invokeEffect);
			hooks._pendingEffects = [];
			currentIndex = 0;
		}
	}
	previousComponent = currentComponent;
};
options.diffed = vnode => {
	if (oldAfterDiff) oldAfterDiff(vnode);
	const c = vnode._component;
	if (c && c.__hooks) {
		if (c.__hooks._pendingEffects.length) afterPaint(afterPaintEffects.push(c));
		c.__hooks._list.forEach(hookItem => {
			if (hookItem._pendingArgs) {
				hookItem._args = hookItem._pendingArgs;
			}
			if (hookItem._pendingValue !== EMPTY) {
				hookItem._value = hookItem._pendingValue;
			}
			hookItem._pendingArgs = undefined;
			hookItem._pendingValue = EMPTY;
		});
	}
	previousComponent = currentComponent = null;
};
options._commit = (vnode, commitQueue) => {
	commitQueue.some(component => {
		try {
			component._renderCallbacks.forEach(invokeCleanup);
			component._renderCallbacks = component._renderCallbacks.filter(cb =>
				cb._value ? invokeEffect(cb) : true
			);
		} catch (e) {
			commitQueue.some(c => {
				if (c._renderCallbacks) c._renderCallbacks = [];
			});
			commitQueue = [];
			options._catchError(e, component._vnode);
		}
	});
	if (oldCommit) oldCommit(vnode, commitQueue);
};
options.unmount = vnode => {
	if (oldBeforeUnmount) oldBeforeUnmount(vnode);
	const c = vnode._component;
	if (c && c.__hooks) {
		let hasErrored;
		c.__hooks._list.forEach(s => {
			try {
				invokeCleanup(s);
			} catch (e) {
				hasErrored = e;
			}
		});
		c.__hooks = undefined;
		if (hasErrored) options._catchError(hasErrored, c._vnode);
	}
};
function getHookState(index, type) {
	if (options._hook) {
		options._hook(currentComponent, index, currentHook || type);
	}
	currentHook = 0;
	const hooks =
		currentComponent.__hooks ||
		(currentComponent.__hooks = {
			_list: [],
			_pendingEffects: []
		});
	if (index >= hooks._list.length) {
		hooks._list.push({ _pendingValue: EMPTY });
	}
	return hooks._list[index];
}
function useState(initialState) {
	currentHook = 1;
	return useReducer(invokeOrReturn, initialState);
}
function useReducer(reducer, initialState, init) {
	const hookState = getHookState(currentIndex++, 2);
	hookState._reducer = reducer;
	if (!hookState._component) {
		hookState._value = [
			!init ? invokeOrReturn(undefined, initialState) : init(initialState),
			action => {
				const currentValue = hookState._nextValue
					? hookState._nextValue[0]
					: hookState._value[0];
				const nextValue = hookState._reducer(currentValue, action);
				if (currentValue !== nextValue) {
					hookState._nextValue = [nextValue, hookState._value[1]];
					hookState._component.setState({});
				}
			}
		];
		hookState._component = currentComponent;
		if (!currentComponent._hasScuFromHooks) {
			currentComponent._hasScuFromHooks = true;
			let prevScu = currentComponent.shouldComponentUpdate;
			const prevCWU = currentComponent.componentWillUpdate;
			currentComponent.componentWillUpdate = function (p, s, c) {
				if (this._force) {
					let tmp = prevScu;
					prevScu = undefined;
					updateHookState(p, s, c);
					prevScu = tmp;
				}
				if (prevCWU) prevCWU.call(this, p, s, c);
			};
			function updateHookState(p, s, c) {
				if (!hookState._component.__hooks) return true;
				const stateHooks = hookState._component.__hooks._list.filter(
					x => x._component
				);
				const allHooksEmpty = stateHooks.every(x => !x._nextValue);
				if (allHooksEmpty) {
					return prevScu ? prevScu.call(this, p, s, c) : true;
				}
				let shouldUpdate = false;
				stateHooks.forEach(hookItem => {
					if (hookItem._nextValue) {
						const currentValue = hookItem._value[0];
						hookItem._value = hookItem._nextValue;
						hookItem._nextValue = undefined;
						if (currentValue !== hookItem._value[0]) shouldUpdate = true;
					}
				});
				return shouldUpdate || hookState._component.props !== p
					? prevScu
						? prevScu.call(this, p, s, c)
						: true
					: false;
			}
			currentComponent.shouldComponentUpdate = updateHookState;
		}
	}
	return hookState._nextValue || hookState._value;
}
function flushAfterPaintEffects() {
	let component;
	while ((component = afterPaintEffects.shift())) {
		if (!component._parentDom || !component.__hooks) continue;
		try {
			component.__hooks._pendingEffects.forEach(invokeCleanup);
			component.__hooks._pendingEffects.forEach(invokeEffect);
			component.__hooks._pendingEffects = [];
		} catch (e) {
			component.__hooks._pendingEffects = [];
			options._catchError(e, component._vnode);
		}
	}
}
let HAS_RAF = typeof requestAnimationFrame == 'function';
function afterNextFrame(callback) {
	const done = () => {
		clearTimeout(timeout);
		if (HAS_RAF) cancelAnimationFrame(raf);
		setTimeout(callback);
	};
	const timeout = setTimeout(done, RAF_TIMEOUT);
	let raf;
	if (HAS_RAF) {
		raf = requestAnimationFrame(done);
	}
}
function afterPaint(newQueueLength) {
	if (newQueueLength === 1 || prevRaf !== options.requestAnimationFrame) {
		prevRaf = options.requestAnimationFrame;
		(prevRaf || afterNextFrame)(flushAfterPaintEffects);
	}
}
function invokeCleanup(hook) {
	const comp = currentComponent;
	let cleanup = hook._cleanup;
	if (typeof cleanup == 'function') {
		hook._cleanup = undefined;
		cleanup();
	}
	currentComponent = comp;
}
function invokeEffect(hook) {
	const comp = currentComponent;
	hook._cleanup = hook._value();
	currentComponent = comp;
}
function invokeOrReturn(arg, f) {
	return typeof f == 'function' ? f(arg) : f;
}

function initDevTools() {
	if (typeof window != 'undefined' && window.__PREACT_DEVTOOLS__) {
		window.__PREACT_DEVTOOLS__.attachPreact('10.17.0', options, {
			Fragment,
			Component
		});
	}
}

initDevTools();

class Counter extends Component {
  state = { count: 0 };
  increment = () => {
    this.setState({ count: this.state.count + 1 });
    this.setState({ count: this.state.count + 1 });
  };
  render() {
    return  createVNode("div", { children: [
       createVNode("h1", { children: [
        "Class Component Count: ",
        this.state.count
      ] }),
       createVNode("button", { onClick: this.increment, children: "Increment" })
    ] });
  }
}
function CounterFunction() {
  const [count, setCount] = useState(0);
  const increment = () => setCount(count + 1);
  return  createVNode("div", { children: [
     createVNode("h1", { children: [
      "Function Component Count: ",
      count
    ] }),
     createVNode("button", { onClick: increment, children: "Increment" })
  ] });
}
render(
   createVNode("div", { children: [
     createVNode(Counter, {}),
     createVNode(CounterFunction, {})
  ] }),
  document.body
);
`
