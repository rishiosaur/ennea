// import htm from 'htm'
// import scoped from 'scoped-style';


// Base implementation of `htm`
var n = function(hyperscript, e, s, u) {
        var r;
        e[0] = 0;
        for (var h = 1; h < e.length; h++) {
            var p = e[h++],
                a = e[h] ? (e[0] |= p ? 1 : 2, s[e[h++]]) : e[++h];
            3 === p ? u[0] = a : 4 === p ? u[1] = Object.assign(u[1] || {}, a) : 5 === p ? (u[1] = u[1] || {})[e[++h]] = a : 6 === p ? u[1][e[++h]] += a + "" : p ? (r = hyperscript.apply(a, n(hyperscript, a, s, ["", null])), u.push(r), a[0] ? e[0] |= 2 : (e[h - 2] = 0, e[h] = r)) : u.push(a)
        }
        return u
    },
    cache = new Map,
    htm = function(bind) {
        var s = cache.get(this);

        return s || (s = new Map, cache.set(this, s)), (s = n(this, s.get(bind) || (s.set(bind, s = function(n) {
            for (var t, e, s: any = 1, u = "", r = "", h: Array<any> = [0], p = function(n?: any) {
                // console.log({ u,uR: u.replace(/^\s*\n\s*|\s*\n\s*$/g , '') })
                // @ts-ignore
                // console.log({ t, e, s, u })
                1 === s && (n || (u = u.replace(/^\s*\n\s*|\s*\n\s*$/g, "")))
                    ? h.push(0, n, u)
                    : 3 === s && (n || u)
                        ? (h.push(3, n, u), s = 2)
                        : 2 === s && "..." === u && n
                            ? h.push(4, n, 0)
                            : 2 === s && u && !n
                                ? h.push(5, 0, !0, u)
                                : s >= 5 && ((u || !n && 5 === s) && (h.push(s, 0, u, e), s = 6), n && (h.push(s, n, 0, e), s = 6)), u = ""
            }, a = 0; a < n.length; a++) {
                // @ts-ignore
                a && (1 === s && p(), p(a));
                for (var o = 0; o < n[a].length; o++) { // @ts-ignore
                    // @ts-ignore
                    // @ts-ignore
                    t = n[a][o], 1 === s ?
                        "<" === t ?
                            (p(), h = [h], s = 3)
                            : u += t
                        : 4 === s
                            ? "--" === u && ">" === t
                                ? (s = 1, u = "")
                                : u = t + u[0] : r
                                ? t === r
                                    ? r = ""
                                    : u += t
                                : '"' === t || "'" === t
                                    ? r = t : ">" === t
                                        ? (p(), s = 1)
                                        : s && ("=" === t ? (s = 5, e = u, u = "") : "/" === t && (s < 5 || ">" === n[a][o + 1]) ? (p(), 3 === s && (h = h[0]), s = h, (h = h[0]).push(2, 0, s), s = 0) : " " === t || "\t" === t || "\n" === t || "\r" === t ? (p(), s = 2) : u += t), 3 === s && "!--" === u && (s = 4, h = h[0])
                }
                // console.log({ a, h })
            }
            // @ts-ignore
            return p(), h
        }(bind)), s), arguments, [])).length > 1 ? s : s[0]
    };

interface VNode {
    tag: string,
    props: any,
    children: VNode[],
    classComponent?: boolean,
    instance?: Component<any, any>
}

const h = (tag, props, ...children): VNode => {
    if (tag?.prototype && tag.prototype?.__isBoxClassComponent) {
        const instance = new tag(props)
        instance.__node = instance.view()
        return {...instance.__node, classComponent: true, instance}
    }

    if (typeof tag === 'function') {
        return tag(props)
    }

    return {
        tag, props, children: children.flat()
    }
};

const html = htm.bind(h);

const isText = t => ['string', 'number', 'boolean'].includes(typeof t)

const render = (node) => {
    if (isText(node)) {
        return document.createTextNode(node.toString())
    }

    const element = document.createElement(node.tag)
    for (const prop in node.props) {
        element.setAttribute(prop, node.props[prop])
        if (prop === "style") {
            Object.entries(node.props[prop]).forEach(([k, v]) => {
                element.style[k] = v
            })
        }
        if (prop.toString().startsWith("on")) {
            const event = prop.substring(2).toLowerCase()
            element.addEventListener(event, node.props[prop])
        }
    }

    if (node.children) {
        for (const child of node.children) {

            const c = render(child)

            element.appendChild(c)
        }
    }


    if (node?.classComponent) {
        node.instance.__elem = element
        node.instance.onMount()
    }

    return element
}

const mount = (vnode, root) => {
    root.replaceWith(vnode)
    return vnode
}

const diff = (old, nn) => {
    const renderAndReplace = (node) => {
        const newNode = render(nn)
        node.replaceWith(newNode)
        return newNode
    }

    if (nn === undefined) {
        return n => {
            n.remove()
            return undefined
        }
    }

    if (isText(old) || isText(nn)) {
        if (old !== nn) {
            return renderAndReplace
        } else {
            return n => n
        }
    }

    if (old.tag !== nn.tag) {
        return renderAndReplace
    }

    const diffProps = (oldP: VNode, newP: VNode) => {
        const patches = []
        if (newP) {
            Object.entries(newP).forEach(([k, v]) => {
                patches.push((node) => {
                    if (k === 'style') {
                        Object.entries(v).forEach(([p, v]) => node.style[p] = v)
                    } else node.setAttribute(k, v)
                    return node
                })
            })
        }

        // Object.keys(oldP).forEach((k) => console.log(k))
        for (const k in oldP) {
            if (!(k in newP)) {
                patches.push((node) => {
                    node.removeAttribute(k)
                    return node
                })
            }
        }

        return (node: Element): Element => {
            for (const patch of patches) patch(node)
            return node
        }
    }


    const zip = (xs, ys) => Array.from(Array(Math.min(xs.length, ys.length))).map((v, i) => [xs[i], ys[i]])

    const diffChildren = (oldVChildren, newVChildren) => {
        const childPatches = [];

        oldVChildren.forEach((oldVChild, i) => {
            childPatches.push(diff(oldVChild, newVChildren[i]));
        });

        const additionalPatches = [];
        for (const additionalVChild of newVChildren.slice(oldVChildren.length)) {
            additionalPatches.push($node => {
                $node.appendChild(render(additionalVChild));
                return $node;
            });
        }

        return $parent => {

            zip(childPatches, $parent.childNodes).forEach(([p, c]) => p(c))
            additionalPatches.forEach(p => p($parent))

            return $parent;
        };
    };

    const patchProps = diffProps(old.props, nn.props)
    const patchChildren = diffChildren(old.children, nn.children)

    return (node) => {
        // console.log({node})
        patchProps(node)
        patchChildren(node)
        return node
    }

}

class Component<Props, State> {
    props: Props
    state: State

    __node: VNode
    __elem: Element
    __isBoxClassComponent: boolean;
    contexts: { [k: string]: Context<any> };

    constructor(props: Props) {
        this.props = props
    }

    set(state) {
        // console.log(this)
        this.state = {
            ...this.state,
            ...state
        }
        this.reconcile()
    }


    view(): (VNode | VNode[]) {
        return html``
    }

    onMount() {}

    reconcile() {
        const old = this.__node
        const newNode = this.view()
        const d = diff(old, newNode)
        d(this.__elem)
        if (Array.isArray(newNode)) {
            this.__node = html`<div>${newNode}</div>` as VNode
        } else {
            this.__node = newNode
        }

    }

    bind(contexts: { [k: string]: Context<any>  }) {
        Object.assign(this, contexts)
        for (const [k, v] of Object.entries(contexts)) {
            v.bind(this)
        }
    }

    unbind(key) {
        this.contexts[key].unbind(this)
    }
}

Component.prototype.__isBoxClassComponent = true

const Bound = <Props, State>(contexts) =>
    class extends Component<Props, State> {
        constructor(props) {
            super(props);
            this.bind(contexts)
        }
    }




class Context<T> {
    object: T
    components: Component<any, any>[]
    constructor(object: T) {
        this.object = object
        this.components = []
    }

    bind(component: Component<any, any>) {
        this.components = this.components.concat(component)
    }

    update(obj: Partial<T> | ((ctx: Context<T>) => Partial<T>)) {

        if (typeof obj === 'function') {
            this.object = {
                ...this.object,
                ...obj(this)
            }
        }
        else {
            this.object = {
                ...this.object,
                ...obj
            }
        }


        this.refresh()
    }

    refresh() {
        for (const component of this.components) {
            component.reconcile()
        }
    }

    unbind(component) {
        this.components = this.components.filter(z => z !== component)
    }

    static from(object) {
        return new Context(object)
    }

    get(key) {
        return this.object[key]
    }

}

class List<T> extends Context<{ arr: T[] }> {
    constructor(arr: T[]) {
        super({ arr });
    }

    static from(arr) {
        return new List(arr)
    }

    [Symbol.iterator]() {
        return this.object.arr.values
    }

    map(cb) {
        return this.object.arr.map(cb)
    }

    concat(element) {
        return this.object.arr.concat(element)
    }

    push(element) {
        this.object.arr = this.object.arr.concat(element)
        this.refresh()
        return this.object.arr
    }

    filter(cb) {
        return this.object.arr.filter(cb)
    }

    sort (cb) {
        return this.object.arr.sort(cb)
    }

    forEach (cb) {
        return this.object.arr.forEach(cb)
    }

    every (cb) {
        return this.object.arr.every(cb)
    }

    some (cb) {
        return this.object.arr.some(cb)
    }

    includes (cb) {
        return this.object.arr.includes(cb)
    }

    filterMut(cb) {
        this.object.arr = this.filter(cb)
        this.refresh()
        return this.object.arr
    }

}

const todoState = List.from([])

class App extends Bound({ todoState }){
    remove = (z) => {
        this.todoState.filterMut(m => m!=z)
    }

    private todoState: List<string>;

    view() {
        return html`
<div>
    ${this.todoState.map(z => html`<p onclick=${() => this.remove(z)}>${z.title}</p>`)}
</div>`
    }
}


class TodoInput extends Bound({ todoState }) {
    state: { value: string }
    todoState: List<string>
    constructor(props) {
        super(props);
        this.state = { value: '' }
    }
    view() {
        return html`
<div>

<input value=${this.state.value} onchange=${bind => this.state.value = bind.target.value}/>
<button onclick=${() => {
            this.todoState.push({title: this.state.value})
            this.set({ value: '' })
        }}>Add</button>
</div>
`
    }
}

const $app = render(html`<div><${TodoInput}/><${App}/></div>`);
mount($app, document.getElementById('root'));
