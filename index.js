"use strict";
var __makeTemplateObject = (this && this.__makeTemplateObject) || function (cooked, raw) {
    if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
    return cooked;
};
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
exports.__esModule = true;
var htm_1 = require("htm");
var scoped_style_1 = require("scoped-style");
var h = function (tag, props) {
    var _a;
    var children = [];
    for (var _i = 2; _i < arguments.length; _i++) {
        children[_i - 2] = arguments[_i];
    }
    if ((tag === null || tag === void 0 ? void 0 : tag.prototype) && ((_a = tag.prototype) === null || _a === void 0 ? void 0 : _a.__isBoxClassComponent)) {
        var instance = new tag(props);
        instance.__node = instance.view();
        // instance?.onMount()
        return __assign(__assign({}, instance.__node), { classComponent: true, instance: instance });
    }
    if (typeof tag === 'function') {
        // console.log(node.tag(node.props))
        return tag(props);
    }
    return {
        tag: tag, props: props,
        children: children.flat()
    };
};
var html = htm_1["default"].bind(h);
var styled = scoped_style_1["default"](h);
var isText = function (t) { return ['string', 'number', 'boolean'].includes(typeof t); };
var render = function (node) {
    console.log({ node: node, t: isText(node) });
    if (isText(node)) {
        return document.createTextNode(node.toString());
    }
    var element = document.createElement(node.tag);
    for (var prop in node.props) {
        element.setAttribute(prop, node.props[prop]);
        if (prop === "style") {
            Object.entries(node.props[prop]).forEach(function (_a) {
                var k = _a[0], v = _a[1];
                element.style[k] = v;
            });
        }
        if (prop.toString().startsWith("on")) {
            var event_1 = prop.substring(2).toLowerCase();
            element.addEventListener(event_1, node.props[prop]);
        }
    }
    if (node.children) {
        for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
            var child = _a[_i];
            var c = render(child);
            element.appendChild(c);
        }
    }
    if (node === null || node === void 0 ? void 0 : node.classComponent) {
        node.instance.__elem = element;
        node.instance.onMount();
    }
    return element;
};
var mount = function (vnode, root) {
    root.replaceWith(vnode);
    return vnode;
};
var diff = function (old, nn) {
    var renderAndReplace = function (node) {
        var newNode = render(nn);
        node.replaceWith(newNode);
        return newNode;
    };
    if (nn === undefined) {
        return function (n) {
            n.remove();
            return undefined;
        };
    }
    if (isText(old) || isText(nn)) {
        if (old !== nn) {
            return renderAndReplace;
        }
        else {
            return function (n) { return n; };
        }
    }
    if (old.tag !== nn.tag) {
        return renderAndReplace;
    }
    var diffProps = function (oldP, newP) {
        var patches = [];
        if (newP) {
            Object.entries(newP).forEach(function (_a) {
                var k = _a[0], v = _a[1];
                patches.push(function (node) {
                    if (k === 'style') {
                        Object.entries(v).forEach(function (_a) {
                            var p = _a[0], v = _a[1];
                            return node.style[p] = v;
                        });
                    }
                    else
                        node.setAttribute(k, v);
                    return node;
                });
            });
        }
        var _loop_1 = function (k) {
            if (!(k in newP)) {
                patches.push(function (node) {
                    node.removeAttribute(k);
                    return node;
                });
            }
        };
        // Object.keys(oldP).forEach((k) => console.log(k))
        for (var k in oldP) {
            _loop_1(k);
        }
        return function (node) {
            for (var _i = 0, patches_1 = patches; _i < patches_1.length; _i++) {
                var patch = patches_1[_i];
                patch(node);
            }
            return node;
        };
    };
    var zip = function (xs, ys) { return Array.from(Array(Math.min(xs.length, ys.length))).map(function (v, i) { return [xs[i], ys[i]]; }); };
    var diffChildren = function (oldVChildren, newVChildren) {
        var childPatches = [];
        oldVChildren.forEach(function (oldVChild, i) {
            childPatches.push(diff(oldVChild, newVChildren[i]));
        });
        var additionalPatches = [];
        var _loop_2 = function (additionalVChild) {
            additionalPatches.push(function ($node) {
                $node.appendChild(render(additionalVChild));
                return $node;
            });
        };
        for (var _i = 0, _a = newVChildren.slice(oldVChildren.length); _i < _a.length; _i++) {
            var additionalVChild = _a[_i];
            _loop_2(additionalVChild);
        }
        return function ($parent) {
            zip(childPatches, $parent.childNodes).forEach(function (_a) {
                var p = _a[0], c = _a[1];
                return p(c);
            });
            additionalPatches.forEach(function (p) { return p($parent); });
            return $parent;
        };
    };
    var patchProps = diffProps(old.props, nn.props);
    var patchChildren = diffChildren(old.children, nn.children);
    return function (node) {
        // console.log({node})
        patchProps(node);
        patchChildren(node);
        return node;
    };
};
var Component = /** @class */ (function () {
    function Component(props) {
        this.props = props;
    }
    Component.prototype.set = function (state) {
        console.log(this);
        this.state = __assign(__assign({}, this.state), state);
        this.reconcile();
    };
    Component.prototype.view = function () {
        return html(templateObject_1 || (templateObject_1 = __makeTemplateObject([""], [""])));
    };
    Component.prototype.onMount = function () { };
    Component.prototype.reconcile = function () {
        var old = this.__node;
        var newNode = this.view();
        var d = diff(old, newNode);
        d(this.__elem);
        if (Array.isArray(newNode)) {
            this.__node = html(templateObject_2 || (templateObject_2 = __makeTemplateObject(["<div>", "</div>"], ["<div>", "</div>"])), newNode);
        }
        else {
            this.__node = newNode;
        }
    };
    Component.prototype.bind = function (contexts) {
        Object.assign(this, contexts);
        for (var _i = 0, _a = Object.entries(contexts); _i < _a.length; _i++) {
            var _b = _a[_i], k = _b[0], v = _b[1];
            v.bind(this);
        }
    };
    Component.prototype.unbind = function (key) {
        this.contexts[key].unbind(this);
    };
    return Component;
}());
Component.prototype.__isBoxClassComponent = true;
var Bound = function (contexts) {
    return /** @class */ (function (_super) {
        __extends(class_1, _super);
        function class_1(props) {
            var _this = _super.call(this, props) || this;
            _this.bind(contexts);
            return _this;
        }
        return class_1;
    }(Component));
};
var Context = /** @class */ (function () {
    function Context(object) {
        this.object = object;
        this.components = [];
    }
    Context.prototype.bind = function (component) {
        this.components = this.components.concat(component);
    };
    Context.prototype.update = function (obj) {
        if (typeof obj === 'function') {
            console.log({ hello: obj(this)
            });
            this.object = __assign(__assign({}, this.object), obj(this));
        }
        else {
            this.object = __assign(__assign({}, this.object), obj);
        }
        this.refresh();
    };
    Context.prototype.refresh = function () {
        for (var _i = 0, _a = this.components; _i < _a.length; _i++) {
            var component = _a[_i];
            component.reconcile();
        }
    };
    Context.prototype.unbind = function (component) {
        this.components = this.components.filter(function (z) { return z !== component; });
    };
    Context.from = function (object) {
        return new Context(object);
    };
    Context.prototype.get = function (key) {
        return this.object[key];
    };
    return Context;
}());
var List = /** @class */ (function (_super) {
    __extends(List, _super);
    function List(arr) {
        return _super.call(this, { arr: arr }) || this;
    }
    List.from = function (arr) {
        return new List(arr);
    };
    List.prototype[Symbol.iterator] = function () {
        return this.object.arr.values;
    };
    List.prototype.map = function (cb) {
        return this.object.arr.map(cb);
    };
    List.prototype.concat = function (element) {
        return this.object.arr.concat(element);
    };
    List.prototype.push = function (element) {
        this.object.arr = this.object.arr.concat(element);
        this.refresh();
        return this.object.arr;
    };
    List.prototype.filter = function (cb) {
        return this.object.arr.filter(cb);
    };
    List.prototype.sort = function (cb) {
        return this.object.arr.sort(cb);
    };
    List.prototype.forEach = function (cb) {
        return this.object.arr.forEach(cb);
    };
    List.prototype.every = function (cb) {
        return this.object.arr.every(cb);
    };
    List.prototype.some = function (cb) {
        return this.object.arr.some(cb);
    };
    List.prototype.includes = function (cb) {
        return this.object.arr.includes(cb);
    };
    List.prototype.filterMut = function (cb) {
        this.object.arr = this.filter(cb);
        this.refresh();
        return this.object.arr;
    };
    return List;
}(Context));
var todoState = List.from([]);
var App = /** @class */ (function (_super) {
    __extends(App, _super);
    function App() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.remove = function (z) {
            _this.todoState.filterMut(function (m) { return m != z; });
        };
        return _this;
    }
    App.prototype.view = function () {
        var _this = this;
        return html(templateObject_4 || (templateObject_4 = __makeTemplateObject(["\n<div>\n    ", "\n</div>"], ["\n<div>\n    ", "\n</div>"])), this.todoState.map(function (z) { return html(templateObject_3 || (templateObject_3 = __makeTemplateObject(["<p onclick=", ">", "</p>"], ["<p onclick=", ">", "</p>"])), function () { return _this.remove(z); }, z.title); }));
    };
    return App;
}(Bound({ todoState: todoState })));
var Button = styled('button')(templateObject_5 || (templateObject_5 = __makeTemplateObject(["\n  background-color: orange;\n  border: none;\n  border-radius: 2px;\n  :hover,\n  :focus,\n  :active {\n    padding: 10px;\n  }\n  @media screen and (max-width: 640px) {\n    background: blue;\n    :hover,\n    :focus,\n    :active {\n      padding: 5px;\n    }\n  }"], ["\n  background-color: orange;\n  border: none;\n  border-radius: 2px;\n  :hover,\n  :focus,\n  :active {\n    padding: 10px;\n  }\n  @media screen and (max-width: 640px) {\n    background: blue;\n    :hover,\n    :focus,\n    :active {\n      padding: 5px;\n    }\n  }"])));
var TodoInput = /** @class */ (function (_super) {
    __extends(TodoInput, _super);
    function TodoInput(props) {
        var _this = _super.call(this, props) || this;
        _this.state = { value: '' };
        return _this;
    }
    TodoInput.prototype.view = function () {
        var _this = this;
        return html(templateObject_6 || (templateObject_6 = __makeTemplateObject(["\n<div>\n\n<input value=", " onchange=", "/>\n<", " onclick=", ">Add<//>\n</div>\n"], ["\n<div>\n\n<input value=", " onchange=", "/>\n<", " onclick=",
            ">Add<//>\n</div>\n"])), this.state.value, function (e) { return _this.state.value = e.target.value; }, Button, function () {
            _this.todoState.push({ title: _this.state.value });
            _this.set({ value: '' });
        });
    };
    return TodoInput;
}(Bound({ todoState: todoState })));
var $app = render(html(templateObject_7 || (templateObject_7 = __makeTemplateObject(["<div><", "/><", "/></div>"], ["<div><", "/><", "/></div>"])), TodoInput, App));
mount($app, document.getElementById('root'));
var templateObject_1, templateObject_2, templateObject_3, templateObject_4, templateObject_5, templateObject_6, templateObject_7;
