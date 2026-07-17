 (() => { 
 	var __webpack_modules__ = ({

 6689:
 ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
 __webpack_require__.d(__webpack_exports__, {
   createUndoManager: () => ( createUndoManager)
 });
 var _wordpress_is_shallow_equal__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(923);
 var _wordpress_is_shallow_equal__WEBPACK_IMPORTED_MODULE_0___default = __webpack_require__.n(_wordpress_is_shallow_equal__WEBPACK_IMPORTED_MODULE_0__);









function mergeHistoryChanges(changes1, changes2) {
  
  const newChanges = {
    ...changes1
  };
  Object.entries(changes2).forEach(([key, value]) => {
    if (newChanges[key]) {
      newChanges[key] = {
        ...newChanges[key],
        to: value.to
      };
    } else {
      newChanges[key] = value;
    }
  });
  return newChanges;
}


const addHistoryChangesIntoRecord = (record, changes) => {
  const existingChangesIndex = record?.findIndex(({
    id: recordIdentifier
  }) => {
    return typeof recordIdentifier === 'string' ? recordIdentifier === changes.id : _wordpress_is_shallow_equal__WEBPACK_IMPORTED_MODULE_0___default()(recordIdentifier, changes.id);
  });
  const nextRecord = [...record];
  if (existingChangesIndex !== -1) {
    
    nextRecord[existingChangesIndex] = {
      id: changes.id,
      changes: mergeHistoryChanges(nextRecord[existingChangesIndex].changes, changes.changes)
    };
  } else {
    nextRecord.push(changes);
  }
  return nextRecord;
};


function createUndoManager() {
  
  let history = [];
  
  let stagedRecord = [];
  
  let offset = 0;
  const dropPendingRedos = () => {
    history = history.slice(0, offset || undefined);
    offset = 0;
  };
  const appendStagedRecordToLatestHistoryRecord = () => {
    var _history$index;
    const index = history.length === 0 ? 0 : history.length - 1;
    let latestRecord = (_history$index = history[index]) !== null && _history$index !== void 0 ? _history$index : [];
    stagedRecord.forEach(changes => {
      latestRecord = addHistoryChangesIntoRecord(latestRecord, changes);
    });
    stagedRecord = [];
    history[index] = latestRecord;
  };

  
  const isRecordEmpty = record => {
    const filteredRecord = record.filter(({
      changes
    }) => {
      return Object.values(changes).some(({
        from,
        to
      }) => typeof from !== 'function' && typeof to !== 'function' && !_wordpress_is_shallow_equal__WEBPACK_IMPORTED_MODULE_0___default()(from, to));
    });
    return !filteredRecord.length;
  };
  return {
    
    addRecord(record, isStaged = false) {
      const isEmpty = !record || isRecordEmpty(record);
      if (isStaged) {
        if (isEmpty) {
          return;
        }
        record.forEach(changes => {
          stagedRecord = addHistoryChangesIntoRecord(stagedRecord, changes);
        });
      } else {
        dropPendingRedos();
        if (stagedRecord.length) {
          appendStagedRecordToLatestHistoryRecord();
        }
        if (isEmpty) {
          return;
        }
        history.push(record);
      }
    },
    undo() {
      if (stagedRecord.length) {
        dropPendingRedos();
        appendStagedRecordToLatestHistoryRecord();
      }
      const undoRecord = history[history.length - 1 + offset];
      if (!undoRecord) {
        return;
      }
      offset -= 1;
      return undoRecord;
    },
    redo() {
      const redoRecord = history[history.length + offset];
      if (!redoRecord) {
        return;
      }
      offset += 1;
      return redoRecord;
    },
    hasUndo() {
      return !!history[history.length - 1 + offset];
    },
    hasRedo() {
      return !!history[history.length + offset];
    }
  };
}


 }),

 3758:
 (function(module) {


(function webpackUniversalModuleDefinition(root, factory) {
	if(true)
		module.exports = factory();
	else {}
})(this, function() {
return  (function() { 
 	var __webpack_modules__ = ({

 686:
 (function(__unused_webpack_module, __nested_webpack_exports__, __nested_webpack_require_623__) {

"use strict";


__nested_webpack_require_623__.d(__nested_webpack_exports__, {
  "default": function() { return  clipboard; }
});


var tiny_emitter = __nested_webpack_require_623__(279);
var tiny_emitter_default = __nested_webpack_require_623__.n(tiny_emitter);

var listen = __nested_webpack_require_623__(370);
var listen_default = __nested_webpack_require_623__.n(listen);

var src_select = __nested_webpack_require_623__(817);
var select_default = __nested_webpack_require_623__.n(src_select);
;

function command(type) {
  try {
    return document.execCommand(type);
  } catch (err) {
    return false;
  }
}
;




var ClipboardActionCut = function ClipboardActionCut(target) {
  var selectedText = select_default()(target);
  command('cut');
  return selectedText;
};

 var actions_cut = (ClipboardActionCut);
;

function createFakeElement(value) {
  var isRTL = document.documentElement.getAttribute('dir') === 'rtl';
  var fakeElement = document.createElement('textarea'); 

  fakeElement.style.fontSize = '12pt'; 

  fakeElement.style.border = '0';
  fakeElement.style.padding = '0';
  fakeElement.style.margin = '0'; 

  fakeElement.style.position = 'absolute';
  fakeElement.style[isRTL ? 'right' : 'left'] = '-9999px'; 

  var yPosition = window.pageYOffset || document.documentElement.scrollTop;
  fakeElement.style.top = "".concat(yPosition, "px");
  fakeElement.setAttribute('readonly', '');
  fakeElement.value = value;
  return fakeElement;
}
;





var fakeCopyAction = function fakeCopyAction(value, options) {
  var fakeElement = createFakeElement(value);
  options.container.appendChild(fakeElement);
  var selectedText = select_default()(fakeElement);
  command('copy');
  fakeElement.remove();
  return selectedText;
};



var ClipboardActionCopy = function ClipboardActionCopy(target) {
  var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
    container: document.body
  };
  var selectedText = '';

  if (typeof target === 'string') {
    selectedText = fakeCopyAction(target, options);
  } else if (target instanceof HTMLInputElement && !['text', 'search', 'url', 'tel', 'password'].includes(target === null || target === void 0 ? void 0 : target.type)) {
    
    selectedText = fakeCopyAction(target.value, options);
  } else {
    selectedText = select_default()(target);
    command('copy');
  }

  return selectedText;
};

 var actions_copy = (ClipboardActionCopy);
;
function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }





var ClipboardActionDefault = function ClipboardActionDefault() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  
  var _options$action = options.action,
      action = _options$action === void 0 ? 'copy' : _options$action,
      container = options.container,
      target = options.target,
      text = options.text; 

  if (action !== 'copy' && action !== 'cut') {
    throw new Error('Invalid "action" value, use either "copy" or "cut"');
  } 


  if (target !== undefined) {
    if (target && _typeof(target) === 'object' && target.nodeType === 1) {
      if (action === 'copy' && target.hasAttribute('disabled')) {
        throw new Error('Invalid "target" attribute. Please use "readonly" instead of "disabled" attribute');
      }

      if (action === 'cut' && (target.hasAttribute('readonly') || target.hasAttribute('disabled'))) {
        throw new Error('Invalid "target" attribute. You can\'t cut text from elements with "readonly" or "disabled" attributes');
      }
    } else {
      throw new Error('Invalid "target" value, use a valid Element');
    }
  } 


  if (text) {
    return actions_copy(text, {
      container: container
    });
  } 


  if (target) {
    return action === 'cut' ? actions_cut(target) : actions_copy(target, {
      container: container
    });
  }
};

 var actions_default = (ClipboardActionDefault);
;
function clipboard_typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { clipboard_typeof = function _typeof(obj) { return typeof obj; }; } else { clipboard_typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return clipboard_typeof(obj); }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (clipboard_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Date.prototype.toString.call(Reflect.construct(Date, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }








function getAttributeValue(suffix, element) {
  var attribute = "data-clipboard-".concat(suffix);

  if (!element.hasAttribute(attribute)) {
    return;
  }

  return element.getAttribute(attribute);
}



var Clipboard = function (_Emitter) {
  _inherits(Clipboard, _Emitter);

  var _super = _createSuper(Clipboard);

  
  function Clipboard(trigger, options) {
    var _this;

    _classCallCheck(this, Clipboard);

    _this = _super.call(this);

    _this.resolveOptions(options);

    _this.listenClick(trigger);

    return _this;
  }
  


  _createClass(Clipboard, [{
    key: "resolveOptions",
    value: function resolveOptions() {
      var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
      this.action = typeof options.action === 'function' ? options.action : this.defaultAction;
      this.target = typeof options.target === 'function' ? options.target : this.defaultTarget;
      this.text = typeof options.text === 'function' ? options.text : this.defaultText;
      this.container = clipboard_typeof(options.container) === 'object' ? options.container : document.body;
    }
    

  }, {
    key: "listenClick",
    value: function listenClick(trigger) {
      var _this2 = this;

      this.listener = listen_default()(trigger, 'click', function (e) {
        return _this2.onClick(e);
      });
    }
    

  }, {
    key: "onClick",
    value: function onClick(e) {
      var trigger = e.delegateTarget || e.currentTarget;
      var action = this.action(trigger) || 'copy';
      var text = actions_default({
        action: action,
        container: this.container,
        target: this.target(trigger),
        text: this.text(trigger)
      }); 

      this.emit(text ? 'success' : 'error', {
        action: action,
        text: text,
        trigger: trigger,
        clearSelection: function clearSelection() {
          if (trigger) {
            trigger.focus();
          }

          window.getSelection().removeAllRanges();
        }
      });
    }
    

  }, {
    key: "defaultAction",
    value: function defaultAction(trigger) {
      return getAttributeValue('action', trigger);
    }
    

  }, {
    key: "defaultTarget",
    value: function defaultTarget(trigger) {
      var selector = getAttributeValue('target', trigger);

      if (selector) {
        return document.querySelector(selector);
      }
    }
    

  }, {
    key: "defaultText",

    
    value: function defaultText(trigger) {
      return getAttributeValue('text', trigger);
    }
    

  }, {
    key: "destroy",
    value: function destroy() {
      this.listener.destroy();
    }
  }], [{
    key: "copy",
    value: function copy(target) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {
        container: document.body
      };
      return actions_copy(target, options);
    }
    

  }, {
    key: "cut",
    value: function cut(target) {
      return actions_cut(target);
    }
    

  }, {
    key: "isSupported",
    value: function isSupported() {
      var action = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ['copy', 'cut'];
      var actions = typeof action === 'string' ? [action] : action;
      var support = !!document.queryCommandSupported;
      actions.forEach(function (action) {
        support = support && !!document.queryCommandSupported(action);
      });
      return support;
    }
  }]);

  return Clipboard;
}((tiny_emitter_default()));

 var clipboard = (Clipboard);

 }),

 828:
 (function(module) {

var DOCUMENT_NODE_TYPE = 9;


if (typeof Element !== 'undefined' && !Element.prototype.matches) {
    var proto = Element.prototype;

    proto.matches = proto.matchesSelector ||
                    proto.mozMatchesSelector ||
                    proto.msMatchesSelector ||
                    proto.oMatchesSelector ||
                    proto.webkitMatchesSelector;
}


function closest (element, selector) {
    while (element && element.nodeType !== DOCUMENT_NODE_TYPE) {
        if (typeof element.matches === 'function' &&
            element.matches(selector)) {
          return element;
        }
        element = element.parentNode;
    }
}

module.exports = closest;


 }),

 438:
 (function(module, __unused_webpack_exports, __nested_webpack_require_15749__) {

var closest = __nested_webpack_require_15749__(828);


function _delegate(element, selector, type, callback, useCapture) {
    var listenerFn = listener.apply(this, arguments);

    element.addEventListener(type, listenerFn, useCapture);

    return {
        destroy: function() {
            element.removeEventListener(type, listenerFn, useCapture);
        }
    }
}


function delegate(elements, selector, type, callback, useCapture) {
    
    if (typeof elements.addEventListener === 'function') {
        return _delegate.apply(null, arguments);
    }

    
    if (typeof type === 'function') {
        
        
        return _delegate.bind(null, document).apply(null, arguments);
    }

    
    if (typeof elements === 'string') {
        elements = document.querySelectorAll(elements);
    }

    
    return Array.prototype.map.call(elements, function (element) {
        return _delegate(element, selector, type, callback, useCapture);
    });
}


function listener(element, selector, type, callback) {
    return function(e) {
        e.delegateTarget = closest(e.target, selector);

        if (e.delegateTarget) {
            callback.call(element, e);
        }
    }
}

module.exports = delegate;


 }),

 879:
 (function(__unused_webpack_module, exports) {


exports.node = function(value) {
    return value !== undefined
        && value instanceof HTMLElement
        && value.nodeType === 1;
};


exports.nodeList = function(value) {
    var type = Object.prototype.toString.call(value);

    return value !== undefined
        && (type === '[object NodeList]' || type === '[object HTMLCollection]')
        && ('length' in value)
        && (value.length === 0 || exports.node(value[0]));
};


exports.string = function(value) {
    return typeof value === 'string'
        || value instanceof String;
};


exports.fn = function(value) {
    var type = Object.prototype.toString.call(value);

    return type === '[object Function]';
};


 }),

 370:
 (function(module, __unused_webpack_exports, __nested_webpack_require_19113__) {

var is = __nested_webpack_require_19113__(879);
var delegate = __nested_webpack_require_19113__(438);


function listen(target, type, callback) {
    if (!target && !type && !callback) {
        throw new Error('Missing required arguments');
    }

    if (!is.string(type)) {
        throw new TypeError('Second argument must be a String');
    }

    if (!is.fn(callback)) {
        throw new TypeError('Third argument must be a Function');
    }

    if (is.node(target)) {
        return listenNode(target, type, callback);
    }
    else if (is.nodeList(target)) {
        return listenNodeList(target, type, callback);
    }
    else if (is.string(target)) {
        return listenSelector(target, type, callback);
    }
    else {
        throw new TypeError('First argument must be a String, HTMLElement, HTMLCollection, or NodeList');
    }
}


function listenNode(node, type, callback) {
    node.addEventListener(type, callback);

    return {
        destroy: function() {
            node.removeEventListener(type, callback);
        }
    }
}


function listenNodeList(nodeList, type, callback) {
    Array.prototype.forEach.call(nodeList, function(node) {
        node.addEventListener(type, callback);
    });

    return {
        destroy: function() {
            Array.prototype.forEach.call(nodeList, function(node) {
                node.removeEventListener(type, callback);
            });
        }
    }
}


function listenSelector(selector, type, callback) {
    return delegate(document.body, selector, type, callback);
}

module.exports = listen;


 }),

 817:
 (function(module) {

function select(element) {
    var selectedText;

    if (element.nodeName === 'SELECT') {
        element.focus();

        selectedText = element.value;
    }
    else if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
        var isReadOnly = element.hasAttribute('readonly');

        if (!isReadOnly) {
            element.setAttribute('readonly', '');
        }

        element.select();
        element.setSelectionRange(0, element.value.length);

        if (!isReadOnly) {
            element.removeAttribute('readonly');
        }

        selectedText = element.value;
    }
    else {
        if (element.hasAttribute('contenteditable')) {
            element.focus();
        }

        var selection = window.getSelection();
        var range = document.createRange();

        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);

        selectedText = selection.toString();
    }

    return selectedText;
}

module.exports = select;


 }),

 279:
 (function(module) {

function E () {
  
  
}

E.prototype = {
  on: function (name, callback, ctx) {
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx
    });

    return this;
  },

  once: function (name, callback, ctx) {
    var self = this;
    function listener () {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    };

    listener._ = callback
    return this.on(name, listener, ctx);
  },

  emit: function (name) {
    var data = [].slice.call(arguments, 1);
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    var evts = e[name];
    var liveEvents = [];

    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    
    
    

    (liveEvents.length)
      ? e[name] = liveEvents
      : delete e[name];

    return this;
  }
};

module.exports = E;
module.exports.TinyEmitter = E;


 })

 	});

 	
 	var __webpack_module_cache__ = {};
 	
 	
 	function __nested_webpack_require_24495__(moduleId) {
 		
 		if(__webpack_module_cache__[moduleId]) {
 			return __webpack_module_cache__[moduleId].exports;
 		}
 		
 		var module = __webpack_module_cache__[moduleId] = {
 			
 			
 			exports: {}
 		};
 	
 		
 		__webpack_modules__[moduleId](module, module.exports, __nested_webpack_require_24495__);
 	
 		
 		return module.exports;
 	}
 	

 	
 	!function() {
 		
 		__nested_webpack_require_24495__.n = function(module) {
 			var getter = module && module.__esModule ?
 				function() { return module['default']; } :
 				function() { return module; };
 			__nested_webpack_require_24495__.d(getter, { a: getter });
 			return getter;
 		};
 	}();
 	
 	
 	!function() {
 		
 		__nested_webpack_require_24495__.d = function(exports, definition) {
 			for(var key in definition) {
 				if(__nested_webpack_require_24495__.o(definition, key) && !__nested_webpack_require_24495__.o(exports, key)) {
 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
 				}
 			}
 		};
 	}();
 	
 	
 	!function() {
 		__nested_webpack_require_24495__.o = function(obj, prop) { return Object.prototype.hasOwnProperty.call(obj, prop); }
 	}();
 	

 	
 	
 	
 	return __nested_webpack_require_24495__(686);
 })()
.default;
});

 }),

 1933:
 ((module, exports, __webpack_require__) => {

var __WEBPACK_AMD_DEFINE_RESULT__;

(function(window, document, undefined) {

    
    if (!window) {
        return;
    }

    
    var _MAP = {
        8: 'backspace',
        9: 'tab',
        13: 'enter',
        16: 'shift',
        17: 'ctrl',
        18: 'alt',
        20: 'capslock',
        27: 'esc',
        32: 'space',
        33: 'pageup',
        34: 'pagedown',
        35: 'end',
        36: 'home',
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down',
        45: 'ins',
        46: 'del',
        91: 'meta',
        93: 'meta',
        224: 'meta'
    };

    
    var _KEYCODE_MAP = {
        106: '*',
        107: '+',
        109: '-',
        110: '.',
        111 : '/',
        186: ';',
        187: '=',
        188: ',',
        189: '-',
        190: '.',
        191: '/',
        192: '`',
        219: '[',
        220: '\\',
        221: ']',
        222: '\''
    };

    
    var _SHIFT_MAP = {
        '~': '`',
        '!': '1',
        '@': '2',
        '#': '3',
        '$': '4',
        '%': '5',
        '^': '6',
        '&': '7',
        '*': '8',
        '(': '9',
        ')': '0',
        '_': '-',
        '+': '=',
        ':': ';',
        '\"': '\'',
        '<': ',',
        '>': '.',
        '?': '/',
        '|': '\\'
    };

    
    var _SPECIAL_ALIASES = {
        'option': 'alt',
        'command': 'meta',
        'return': 'enter',
        'escape': 'esc',
        'plus': '+',
        'mod': /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'meta' : 'ctrl'
    };

    
    var _REVERSE_MAP;

    
    for (var i = 1; i < 20; ++i) {
        _MAP[111 + i] = 'f' + i;
    }

    
    for (i = 0; i <= 9; ++i) {

        
        
        
        
        
        _MAP[i + 96] = i.toString();
    }

    
    function _addEvent(object, type, callback) {
        if (object.addEventListener) {
            object.addEventListener(type, callback, false);
            return;
        }

        object.attachEvent('on' + type, callback);
    }

    
    function _characterFromEvent(e) {

        
        if (e.type == 'keypress') {
            var character = String.fromCharCode(e.which);

            
            
            
            
            
            
            
            
            
            if (!e.shiftKey) {
                character = character.toLowerCase();
            }

            return character;
        }

        
        if (_MAP[e.which]) {
            return _MAP[e.which];
        }

        if (_KEYCODE_MAP[e.which]) {
            return _KEYCODE_MAP[e.which];
        }

        

        
        
        
        return String.fromCharCode(e.which).toLowerCase();
    }

    
    function _modifiersMatch(modifiers1, modifiers2) {
        return modifiers1.sort().join(',') === modifiers2.sort().join(',');
    }

    
    function _eventModifiers(e) {
        var modifiers = [];

        if (e.shiftKey) {
            modifiers.push('shift');
        }

        if (e.altKey) {
            modifiers.push('alt');
        }

        if (e.ctrlKey) {
            modifiers.push('ctrl');
        }

        if (e.metaKey) {
            modifiers.push('meta');
        }

        return modifiers;
    }

    
    function _preventDefault(e) {
        if (e.preventDefault) {
            e.preventDefault();
            return;
        }

        e.returnValue = false;
    }

    
    function _stopPropagation(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
            return;
        }

        e.cancelBubble = true;
    }

    
    function _isModifier(key) {
        return key == 'shift' || key == 'ctrl' || key == 'alt' || key == 'meta';
    }

    
    function _getReverseMap() {
        if (!_REVERSE_MAP) {
            _REVERSE_MAP = {};
            for (var key in _MAP) {

                
                
                if (key > 95 && key < 112) {
                    continue;
                }

                if (_MAP.hasOwnProperty(key)) {
                    _REVERSE_MAP[_MAP[key]] = key;
                }
            }
        }
        return _REVERSE_MAP;
    }

    
    function _pickBestAction(key, modifiers, action) {

        
        
        if (!action) {
            action = _getReverseMap()[key] ? 'keydown' : 'keypress';
        }

        
        
        if (action == 'keypress' && modifiers.length) {
            action = 'keydown';
        }

        return action;
    }

    
    function _keysFromString(combination) {
        if (combination === '+') {
            return ['+'];
        }

        combination = combination.replace(/\+{2}/g, '+plus');
        return combination.split('+');
    }

    
    function _getKeyInfo(combination, action) {
        var keys;
        var key;
        var i;
        var modifiers = [];

        
        
        keys = _keysFromString(combination);

        for (i = 0; i < keys.length; ++i) {
            key = keys[i];

            
            if (_SPECIAL_ALIASES[key]) {
                key = _SPECIAL_ALIASES[key];
            }

            
            
            
            if (action && action != 'keypress' && _SHIFT_MAP[key]) {
                key = _SHIFT_MAP[key];
                modifiers.push('shift');
            }

            
            if (_isModifier(key)) {
                modifiers.push(key);
            }
        }

        
        
        action = _pickBestAction(key, modifiers, action);

        return {
            key: key,
            modifiers: modifiers,
            action: action
        };
    }

    function _belongsTo(element, ancestor) {
        if (element === null || element === document) {
            return false;
        }

        if (element === ancestor) {
            return true;
        }

        return _belongsTo(element.parentNode, ancestor);
    }

    function Mousetrap(targetElement) {
        var self = this;

        targetElement = targetElement || document;

        if (!(self instanceof Mousetrap)) {
            return new Mousetrap(targetElement);
        }

        
        self.target = targetElement;

        
        self._callbacks = {};

        
        self._directMap = {};

        
        var _sequenceLevels = {};

        
        var _resetTimer;

        
        var _ignoreNextKeyup = false;

        
        var _ignoreNextKeypress = false;

        
        var _nextExpectedAction = false;

        
        function _resetSequences(doNotReset) {
            doNotReset = doNotReset || {};

            var activeSequences = false,
                key;

            for (key in _sequenceLevels) {
                if (doNotReset[key]) {
                    activeSequences = true;
                    continue;
                }
                _sequenceLevels[key] = 0;
            }

            if (!activeSequences) {
                _nextExpectedAction = false;
            }
        }

        
        function _getMatches(character, modifiers, e, sequenceName, combination, level) {
            var i;
            var callback;
            var matches = [];
            var action = e.type;

            
            if (!self._callbacks[character]) {
                return [];
            }

            
            if (action == 'keyup' && _isModifier(character)) {
                modifiers = [character];
            }

            
            
            for (i = 0; i < self._callbacks[character].length; ++i) {
                callback = self._callbacks[character][i];

                
                
                if (!sequenceName && callback.seq && _sequenceLevels[callback.seq] != callback.level) {
                    continue;
                }

                
                
                if (action != callback.action) {
                    continue;
                }

                
                
                
                
                
                
                
                if ((action == 'keypress' && !e.metaKey && !e.ctrlKey) || _modifiersMatch(modifiers, callback.modifiers)) {

                    
                    
                    
                    
                    
                    var deleteCombo = !sequenceName && callback.combo == combination;
                    var deleteSequence = sequenceName && callback.seq == sequenceName && callback.level == level;
                    if (deleteCombo || deleteSequence) {
                        self._callbacks[character].splice(i, 1);
                    }

                    matches.push(callback);
                }
            }

            return matches;
        }

        
        function _fireCallback(callback, e, combo, sequence) {

            
            if (self.stopCallback(e, e.target || e.srcElement, combo, sequence)) {
                return;
            }

            if (callback(e, combo) === false) {
                _preventDefault(e);
                _stopPropagation(e);
            }
        }

        
        self._handleKey = function(character, modifiers, e) {
            var callbacks = _getMatches(character, modifiers, e);
            var i;
            var doNotReset = {};
            var maxLevel = 0;
            var processedSequenceCallback = false;

            
            for (i = 0; i < callbacks.length; ++i) {
                if (callbacks[i].seq) {
                    maxLevel = Math.max(maxLevel, callbacks[i].level);
                }
            }

            
            for (i = 0; i < callbacks.length; ++i) {

                
                
                
                
                
                if (callbacks[i].seq) {

                    
                    
                    
                    
                    
                    
                    
                    
                    if (callbacks[i].level != maxLevel) {
                        continue;
                    }

                    processedSequenceCallback = true;

                    
                    doNotReset[callbacks[i].seq] = 1;
                    _fireCallback(callbacks[i].callback, e, callbacks[i].combo, callbacks[i].seq);
                    continue;
                }

                
                
                if (!processedSequenceCallback) {
                    _fireCallback(callbacks[i].callback, e, callbacks[i].combo);
                }
            }

            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            
            var ignoreThisKeypress = e.type == 'keypress' && _ignoreNextKeypress;
            if (e.type == _nextExpectedAction && !_isModifier(character) && !ignoreThisKeypress) {
                _resetSequences(doNotReset);
            }

            _ignoreNextKeypress = processedSequenceCallback && e.type == 'keydown';
        };

        
        function _handleKeyEvent(e) {

            
            
            if (typeof e.which !== 'number') {
                e.which = e.keyCode;
            }

            var character = _characterFromEvent(e);

            
            if (!character) {
                return;
            }

            
            if (e.type == 'keyup' && _ignoreNextKeyup === character) {
                _ignoreNextKeyup = false;
                return;
            }

            self.handleKey(character, _eventModifiers(e), e);
        }

        
        function _resetSequenceTimer() {
            clearTimeout(_resetTimer);
            _resetTimer = setTimeout(_resetSequences, 1000);
        }

        
        function _bindSequence(combo, keys, callback, action) {

            
            
            _sequenceLevels[combo] = 0;

            
            function _increaseSequence(nextAction) {
                return function() {
                    _nextExpectedAction = nextAction;
                    ++_sequenceLevels[combo];
                    _resetSequenceTimer();
                };
            }

            
            function _callbackAndReset(e) {
                _fireCallback(callback, e, combo);

                
                
                
                if (action !== 'keyup') {
                    _ignoreNextKeyup = _characterFromEvent(e);
                }

                
                
                setTimeout(_resetSequences, 10);
            }

            
            
            
            
            
            
            
            
            
            for (var i = 0; i < keys.length; ++i) {
                var isFinal = i + 1 === keys.length;
                var wrappedCallback = isFinal ? _callbackAndReset : _increaseSequence(action || _getKeyInfo(keys[i + 1]).action);
                _bindSingle(keys[i], wrappedCallback, action, combo, i);
            }
        }

        
        function _bindSingle(combination, callback, action, sequenceName, level) {

            
            self._directMap[combination + ':' + action] = callback;

            
            combination = combination.replace(/\s+/g, ' ');

            var sequence = combination.split(' ');
            var info;

            
            
            if (sequence.length > 1) {
                _bindSequence(combination, sequence, callback, action);
                return;
            }

            info = _getKeyInfo(combination, action);

            
            
            self._callbacks[info.key] = self._callbacks[info.key] || [];

            
            _getMatches(info.key, info.modifiers, {type: info.action}, sequenceName, combination, level);

            
            
            
            
            
            
            self._callbacks[info.key][sequenceName ? 'unshift' : 'push']({
                callback: callback,
                modifiers: info.modifiers,
                action: info.action,
                seq: sequenceName,
                level: level,
                combo: combination
            });
        }

        
        self._bindMultiple = function(combinations, callback, action) {
            for (var i = 0; i < combinations.length; ++i) {
                _bindSingle(combinations[i], callback, action);
            }
        };

        
        _addEvent(targetElement, 'keypress', _handleKeyEvent);
        _addEvent(targetElement, 'keydown', _handleKeyEvent);
        _addEvent(targetElement, 'keyup', _handleKeyEvent);
    }

    
    Mousetrap.prototype.bind = function(keys, callback, action) {
        var self = this;
        keys = keys instanceof Array ? keys : [keys];
        self._bindMultiple.call(self, keys, callback, action);
        return self;
    };

    
    Mousetrap.prototype.unbind = function(keys, action) {
        var self = this;
        return self.bind.call(self, keys, function() {}, action);
    };

    
    Mousetrap.prototype.trigger = function(keys, action) {
        var self = this;
        if (self._directMap[keys + ':' + action]) {
            self._directMap[keys + ':' + action]({}, keys);
        }
        return self;
    };

    
    Mousetrap.prototype.reset = function() {
        var self = this;
        self._callbacks = {};
        self._directMap = {};
        return self;
    };

    
    Mousetrap.prototype.stopCallback = function(e, element) {
        var self = this;

        
        if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
            return false;
        }

        if (_belongsTo(element, self.target)) {
            return false;
        }

        
        
        
        
        
        
        if ('composedPath' in e && typeof e.composedPath === 'function') {
            
            var initialEventTarget = e.composedPath()[0];
            if (initialEventTarget !== e.target) {
                element = initialEventTarget;
            }
        }

        
        return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || element.isContentEditable;
    };

    
    Mousetrap.prototype.handleKey = function() {
        var self = this;
        return self._handleKey.apply(self, arguments);
    };

    
    Mousetrap.addKeycodes = function(object) {
        for (var key in object) {
            if (object.hasOwnProperty(key)) {
                _MAP[key] = object[key];
            }
        }
        _REVERSE_MAP = null;
    };

    
    Mousetrap.init = function() {
        var documentMousetrap = Mousetrap(document);
        for (var method in documentMousetrap) {
            if (method.charAt(0) !== '_') {
                Mousetrap[method] = (function(method) {
                    return function() {
                        return documentMousetrap[method].apply(documentMousetrap, arguments);
                    };
                } (method));
            }
        }
    };

    Mousetrap.init();

    
    window.Mousetrap = Mousetrap;

    
    if ( true && module.exports) {
        module.exports = Mousetrap;
    }

    
    if (true) {
        !(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
            return Mousetrap;
        }).call(exports, __webpack_require__, exports, module),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
    }
}) (typeof window !== 'undefined' ? window : null, typeof  window !== 'undefined' ? document : null);


 }),

 5760:
 (() => {



(function(Mousetrap) {
    if (! Mousetrap) {
        return;
    }
    var _globalCallbacks = {};
    var _originalStopCallback = Mousetrap.prototype.stopCallback;

    Mousetrap.prototype.stopCallback = function(e, element, combo, sequence) {
        var self = this;

        if (self.paused) {
            return true;
        }

        if (_globalCallbacks[combo] || _globalCallbacks[sequence]) {
            return false;
        }

        return _originalStopCallback.call(self, e, element, combo);
    };

    Mousetrap.prototype.bindGlobal = function(keys, callback, action) {
        var self = this;
        self.bind(keys, callback, action);

        if (keys instanceof Array) {
            for (var i = 0; i < keys.length; i++) {
                _globalCallbacks[keys[i]] = true;
            }
            return;
        }

        _globalCallbacks[keys] = true;
    };

    Mousetrap.init();
}) (typeof Mousetrap !== "undefined" ? Mousetrap : undefined);


 }),

 923:
 ((module) => {

"use strict";
module.exports = window["wp"]["isShallowEqual"];

 })

 	});

 	
 	var __webpack_module_cache__ = {};
 	
 	
 	function __webpack_require__(moduleId) {
 		
 		var cachedModule = __webpack_module_cache__[moduleId];
 		if (cachedModule !== undefined) {
 			return cachedModule.exports;
 		}
 		
 		var module = __webpack_module_cache__[moduleId] = {
 			
 			
 			exports: {}
 		};
 	
 		
 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
 	
 		
 		return module.exports;
 	}
 	

 	
 	(() => {
 		
 		__webpack_require__.n = (module) => {
 			var getter = module && module.__esModule ?
 				() => (module['default']) :
 				() => (module);
 			__webpack_require__.d(getter, { a: getter });
 			return getter;
 		};
 	})();
 	
 	
 	(() => {
 		
 		__webpack_require__.d = (exports, definition) => {
 			for(var key in definition) {
 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
 				}
 			}
 		};
 	})();
 	
 	
 	(() => {
 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
 	})();
 	
 	
 	(() => {
 		
 		__webpack_require__.r = (exports) => {
 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
 			}
 			Object.defineProperty(exports, '__esModule', { value: true });
 		};
 	})();
 	

var __webpack_exports__ = {};

(() => {
"use strict";

__webpack_require__.r(__webpack_exports__);


__webpack_require__.d(__webpack_exports__, {
  __experimentalUseDialog: () => ( use_dialog),
  __experimentalUseDragging: () => ( useDragging),
  __experimentalUseDropZone: () => ( useDropZone),
  __experimentalUseFixedWindowList: () => ( useFixedWindowList),
  __experimentalUseFocusOutside: () => ( useFocusOutside),
  compose: () => ( higher_order_compose),
  createHigherOrderComponent: () => ( createHigherOrderComponent),
  debounce: () => ( debounce),
  ifCondition: () => ( if_condition),
  pipe: () => ( higher_order_pipe),
  pure: () => ( higher_order_pure),
  throttle: () => ( throttle),
  useAsyncList: () => ( use_async_list),
  useConstrainedTabbing: () => ( use_constrained_tabbing),
  useCopyOnClick: () => ( useCopyOnClick),
  useCopyToClipboard: () => ( useCopyToClipboard),
  useDebounce: () => ( useDebounce),
  useDebouncedInput: () => ( useDebouncedInput),
  useDisabled: () => ( useDisabled),
  useFocusOnMount: () => ( useFocusOnMount),
  useFocusReturn: () => ( use_focus_return),
  useFocusableIframe: () => ( useFocusableIframe),
  useInstanceId: () => ( use_instance_id),
  useIsomorphicLayoutEffect: () => ( use_isomorphic_layout_effect),
  useKeyboardShortcut: () => ( use_keyboard_shortcut),
  useMediaQuery: () => ( useMediaQuery),
  useMergeRefs: () => ( useMergeRefs),
  usePrevious: () => ( usePrevious),
  useReducedMotion: () => ( use_reduced_motion),
  useRefEffect: () => ( useRefEffect),
  useResizeObserver: () => ( useResizeAware),
  useStateWithHistory: () => ( useStateWithHistory),
  useThrottle: () => ( useThrottle),
  useViewportMatch: () => ( use_viewport_match),
  useWarnOnChange: () => ( use_warn_on_change),
  withGlobalEvents: () => ( withGlobalEvents),
  withInstanceId: () => ( with_instance_id),
  withSafeTimeout: () => ( with_safe_timeout),
  withState: () => ( withState)
});

;



var extendStatics = function(d, b) {
  extendStatics = Object.setPrototypeOf ||
      ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
      function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
  return extendStatics(d, b);
};

function __extends(d, b) {
  if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
  extendStatics(d, b);
  function __() { this.constructor = d; }
  d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
  __assign = Object.assign || function __assign(t) {
      for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
      }
      return t;
  }
  return __assign.apply(this, arguments);
}

function __rest(s, e) {
  var t = {};
  for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
      t[p] = s[p];
  if (s != null && typeof Object.getOwnPropertySymbols === "function")
      for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
          if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
              t[p[i]] = s[p[i]];
      }
  return t;
}

function __decorate(decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
}

function __param(paramIndex, decorator) {
  return function (target, key) { decorator(target, key, paramIndex); }
}

function __esDecorate(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
  function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
  var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
  var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
  var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
  var _, done = false;
  for (var i = decorators.length - 1; i >= 0; i--) {
      var context = {};
      for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
      for (var p in contextIn.access) context.access[p] = contextIn.access[p];
      context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
      var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
      if (kind === "accessor") {
          if (result === void 0) continue;
          if (result === null || typeof result !== "object") throw new TypeError("Object expected");
          if (_ = accept(result.get)) descriptor.get = _;
          if (_ = accept(result.set)) descriptor.set = _;
          if (_ = accept(result.init)) initializers.unshift(_);
      }
      else if (_ = accept(result)) {
          if (kind === "field") initializers.unshift(_);
          else descriptor[key] = _;
      }
  }
  if (target) Object.defineProperty(target, contextIn.name, descriptor);
  done = true;
};

function __runInitializers(thisArg, initializers, value) {
  var useValue = arguments.length > 2;
  for (var i = 0; i < initializers.length; i++) {
      value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
  }
  return useValue ? value : void 0;
};

function __propKey(x) {
  return typeof x === "symbol" ? x : "".concat(x);
};

function __setFunctionName(f, name, prefix) {
  if (typeof name === "symbol") name = name.description ? "[".concat(name.description, "]") : "";
  return Object.defineProperty(f, "name", { configurable: true, value: prefix ? "".concat(prefix, " ", name) : name });
};

function __metadata(metadataKey, metadataValue) {
  if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(metadataKey, metadataValue);
}

function __awaiter(thisArg, _arguments, P, generator) {
  function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
  return new (P || (P = Promise))(function (resolve, reject) {
      function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
      function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
      function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
      step((generator = generator.apply(thisArg, _arguments || [])).next());
  });
}

function __generator(thisArg, body) {
  var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
  return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
  function verb(n) { return function (v) { return step([n, v]); }; }
  function step(op) {
      if (f) throw new TypeError("Generator is already executing.");
      while (g && (g = 0, op[0] && (_ = 0)), _) try {
          if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
          if (y = 0, t) op = [op[0] & 2, t.value];
          switch (op[0]) {
              case 0: case 1: t = op; break;
              case 4: _.label++; return { value: op[1], done: false };
              case 5: _.label++; y = op[1]; op = [0]; continue;
              case 7: op = _.ops.pop(); _.trys.pop(); continue;
              default:
                  if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                  if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                  if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                  if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                  if (t[2]) _.ops.pop();
                  _.trys.pop(); continue;
          }
          op = body.call(thisArg, _);
      } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
      if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
  }
}

var __createBinding = Object.create ? (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  var desc = Object.getOwnPropertyDescriptor(m, k);
  if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
  }
  Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
  if (k2 === undefined) k2 = k;
  o[k2] = m[k];
});

function __exportStar(m, o) {
  for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(o, p)) __createBinding(o, m, p);
}

function __values(o) {
  var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
  if (m) return m.call(o);
  if (o && typeof o.length === "number") return {
      next: function () {
          if (o && i >= o.length) o = void 0;
          return { value: o && o[i++], done: !o };
      }
  };
  throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
}

function __read(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
      while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  }
  catch (error) { e = { error: error }; }
  finally {
      try {
          if (r && !r.done && (m = i["return"])) m.call(i);
      }
      finally { if (e) throw e.error; }
  }
  return ar;
}


function __spread() {
  for (var ar = [], i = 0; i < arguments.length; i++)
      ar = ar.concat(__read(arguments[i]));
  return ar;
}


function __spreadArrays() {
  for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
  for (var r = Array(s), k = 0, i = 0; i < il; i++)
      for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
          r[k] = a[j];
  return r;
}

function __spreadArray(to, from, pack) {
  if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
      if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
      }
  }
  return to.concat(ar || Array.prototype.slice.call(from));
}

function __await(v) {
  return this instanceof __await ? (this.v = v, this) : new __await(v);
}

function __asyncGenerator(thisArg, _arguments, generator) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var g = generator.apply(thisArg, _arguments || []), i, q = [];
  return i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i;
  function verb(n) { if (g[n]) i[n] = function (v) { return new Promise(function (a, b) { q.push([n, v, a, b]) > 1 || resume(n, v); }); }; }
  function resume(n, v) { try { step(g[n](v)); } catch (e) { settle(q[0][3], e); } }
  function step(r) { r.value instanceof __await ? Promise.resolve(r.value.v).then(fulfill, reject) : settle(q[0][2], r); }
  function fulfill(value) { resume("next", value); }
  function reject(value) { resume("throw", value); }
  function settle(f, v) { if (f(v), q.shift(), q.length) resume(q[0][0], q[0][1]); }
}

function __asyncDelegator(o) {
  var i, p;
  return i = {}, verb("next"), verb("throw", function (e) { throw e; }), verb("return"), i[Symbol.iterator] = function () { return this; }, i;
  function verb(n, f) { i[n] = o[n] ? function (v) { return (p = !p) ? { value: __await(o[n](v)), done: false } : f ? f(v) : v; } : f; }
}

function __asyncValues(o) {
  if (!Symbol.asyncIterator) throw new TypeError("Symbol.asyncIterator is not defined.");
  var m = o[Symbol.asyncIterator], i;
  return m ? m.call(o) : (o = typeof __values === "function" ? __values(o) : o[Symbol.iterator](), i = {}, verb("next"), verb("throw"), verb("return"), i[Symbol.asyncIterator] = function () { return this; }, i);
  function verb(n) { i[n] = o[n] && function (v) { return new Promise(function (resolve, reject) { v = o[n](v), settle(resolve, reject, v.done, v.value); }); }; }
  function settle(resolve, reject, d, v) { Promise.resolve(v).then(function(v) { resolve({ value: v, done: d }); }, reject); }
}

function __makeTemplateObject(cooked, raw) {
  if (Object.defineProperty) { Object.defineProperty(cooked, "raw", { value: raw }); } else { cooked.raw = raw; }
  return cooked;
};

var __setModuleDefault = Object.create ? (function(o, v) {
  Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
  o["default"] = v;
};

function __importStar(mod) {
  if (mod && mod.__esModule) return mod;
  var result = {};
  if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
  __setModuleDefault(result, mod);
  return result;
}

function __importDefault(mod) {
  return (mod && mod.__esModule) ? mod : { default: mod };
}

function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}

function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
}

function __classPrivateFieldIn(state, receiver) {
  if (receiver === null || (typeof receiver !== "object" && typeof receiver !== "function")) throw new TypeError("Cannot use 'in' operator on non-object");
  return typeof state === "function" ? receiver === state : state.has(receiver);
}

function __addDisposableResource(env, value, async) {
  if (value !== null && value !== void 0) {
    if (typeof value !== "object" && typeof value !== "function") throw new TypeError("Object expected.");
    var dispose;
    if (async) {
        if (!Symbol.asyncDispose) throw new TypeError("Symbol.asyncDispose is not defined.");
        dispose = value[Symbol.asyncDispose];
    }
    if (dispose === void 0) {
        if (!Symbol.dispose) throw new TypeError("Symbol.dispose is not defined.");
        dispose = value[Symbol.dispose];
    }
    if (typeof dispose !== "function") throw new TypeError("Object not disposable.");
    env.stack.push({ value: value, dispose: dispose, async: async });
  }
  else if (async) {
    env.stack.push({ async: true });
  }
  return value;
}

var _SuppressedError = typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

function __disposeResources(env) {
  function fail(e) {
    env.error = env.hasError ? new _SuppressedError(e, env.error, "An error was suppressed during disposal.") : e;
    env.hasError = true;
  }
  function next() {
    while (env.stack.length) {
      var rec = env.stack.pop();
      try {
        var result = rec.dispose && rec.dispose.call(rec.value);
        if (rec.async) return Promise.resolve(result).then(next, function(e) { fail(e); return next(); });
      }
      catch (e) {
          fail(e);
      }
    }
    if (env.hasError) throw env.error;
  }
  return next();
}

 const tslib_es6 = ({
  __extends,
  __assign,
  __rest,
  __decorate,
  __param,
  __metadata,
  __awaiter,
  __generator,
  __createBinding,
  __exportStar,
  __values,
  __read,
  __spread,
  __spreadArrays,
  __spreadArray,
  __await,
  __asyncGenerator,
  __asyncDelegator,
  __asyncValues,
  __makeTemplateObject,
  __importStar,
  __importDefault,
  __classPrivateFieldGet,
  __classPrivateFieldSet,
  __classPrivateFieldIn,
  __addDisposableResource,
  __disposeResources,
});

;

var SUPPORTED_LOCALE = {
    tr: {
        regexp: /\u0130|\u0049|\u0049\u0307/g,
        map: {
            İ: "\u0069",
            I: "\u0131",
            İ: "\u0069",
        },
    },
    az: {
        regexp: /\u0130/g,
        map: {
            İ: "\u0069",
            I: "\u0131",
            İ: "\u0069",
        },
    },
    lt: {
        regexp: /\u0049|\u004A|\u012E|\u00CC|\u00CD|\u0128/g,
        map: {
            I: "\u0069\u0307",
            J: "\u006A\u0307",
            Į: "\u012F\u0307",
            Ì: "\u0069\u0307\u0300",
            Í: "\u0069\u0307\u0301",
            Ĩ: "\u0069\u0307\u0303",
        },
    },
};

function localeLowerCase(str, locale) {
    var lang = SUPPORTED_LOCALE[locale.toLowerCase()];
    if (lang)
        return lowerCase(str.replace(lang.regexp, function (m) { return lang.map[m]; }));
    return lowerCase(str);
}

function lowerCase(str) {
    return str.toLowerCase();
}

;


var DEFAULT_SPLIT_REGEXP = [/([a-z0-9])([A-Z])/g, /([A-Z])([A-Z][a-z])/g];

var DEFAULT_STRIP_REGEXP = /[^A-Z0-9]+/gi;

function noCase(input, options) {
    if (options === void 0) { options = {}; }
    var _a = options.splitRegexp, splitRegexp = _a === void 0 ? DEFAULT_SPLIT_REGEXP : _a, _b = options.stripRegexp, stripRegexp = _b === void 0 ? DEFAULT_STRIP_REGEXP : _b, _c = options.transform, transform = _c === void 0 ? lowerCase : _c, _d = options.delimiter, delimiter = _d === void 0 ? " " : _d;
    var result = replace(replace(input, splitRegexp, "$1\0$2"), stripRegexp, "\0");
    var start = 0;
    var end = result.length;
    
    while (result.charAt(start) === "\0")
        start++;
    while (result.charAt(end - 1) === "\0")
        end--;
    
    return result.slice(start, end).split("\0").map(transform).join(delimiter);
}

function replace(input, re, value) {
    if (re instanceof RegExp)
        return input.replace(re, value);
    return re.reduce(function (input, re) { return input.replace(re, value); }, input);
}

;


function pascalCaseTransform(input, index) {
    var firstChar = input.charAt(0);
    var lowerChars = input.substr(1).toLowerCase();
    if (index > 0 && firstChar >= "0" && firstChar <= "9") {
        return "_" + firstChar + lowerChars;
    }
    return "" + firstChar.toUpperCase() + lowerChars;
}
function pascalCaseTransformMerge(input) {
    return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}
function pascalCase(input, options) {
    if (options === void 0) { options = {}; }
    return noCase(input, __assign({ delimiter: "", transform: pascalCaseTransform }, options));
}

;



function createHigherOrderComponent(mapComponent, modifierName) {
  return Inner => {
    const Outer = mapComponent(Inner);
    Outer.displayName = hocName(modifierName, Inner);
    return Outer;
  };
}


const hocName = (name, Inner) => {
  const inner = Inner.displayName || Inner.name || 'Component';
  const outer = pascalCase(name !== null && name !== void 0 ? name : '');
  return `${outer}(${inner})`;
};

;



const debounce = (func, wait, options) => {
  let lastArgs;
  let lastThis;
  let maxWait = 0;
  let result;
  let timerId;
  let lastCallTime;
  let lastInvokeTime = 0;
  let leading = false;
  let maxing = false;
  let trailing = true;
  if (options) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    if (options.maxWait !== undefined) {
      maxWait = Math.max(options.maxWait, wait);
    }
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  function invokeFunc(time) {
    const args = lastArgs;
    const thisArg = lastThis;
    lastArgs = undefined;
    lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }
  function startTimer(pendingFunc, waitTime) {
    timerId = setTimeout(pendingFunc, waitTime);
  }
  function cancelTimer() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
  }
  function leadingEdge(time) {
    
    lastInvokeTime = time;
    
    startTimer(timerExpired, wait);
    
    return leading ? invokeFunc(time) : result;
  }
  function getTimeSinceLastCall(time) {
    return time - (lastCallTime || 0);
  }
  function remainingWait(time) {
    const timeSinceLastCall = getTimeSinceLastCall(time);
    const timeSinceLastInvoke = time - lastInvokeTime;
    const timeWaiting = wait - timeSinceLastCall;
    return maxing ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke) : timeWaiting;
  }
  function shouldInvoke(time) {
    const timeSinceLastCall = getTimeSinceLastCall(time);
    const timeSinceLastInvoke = time - lastInvokeTime;

    
    
    
    return lastCallTime === undefined || timeSinceLastCall >= wait || timeSinceLastCall < 0 || maxing && timeSinceLastInvoke >= maxWait;
  }
  function timerExpired() {
    const time = Date.now();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    
    startTimer(timerExpired, remainingWait(time));
    return undefined;
  }
  function clearTimer() {
    timerId = undefined;
  }
  function trailingEdge(time) {
    clearTimer();

    
    
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }
  function cancel() {
    cancelTimer();
    lastInvokeTime = 0;
    clearTimer();
    lastArgs = lastCallTime = lastThis = undefined;
  }
  function flush() {
    return pending() ? trailingEdge(Date.now()) : result;
  }
  function pending() {
    return timerId !== undefined;
  }
  function debounced(...args) {
    const time = Date.now();
    const isInvoking = shouldInvoke(time);
    lastArgs = args;
    lastThis = this;
    lastCallTime = time;
    if (isInvoking) {
      if (!pending()) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        
        startTimer(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (!pending()) {
      startTimer(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  debounced.pending = pending;
  return debounced;
};

;





const throttle = (func, wait, options) => {
  let leading = true;
  let trailing = true;
  if (options) {
    leading = 'leading' in options ? !!options.leading : leading;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }
  return debounce(func, wait, {
    leading,
    trailing,
    maxWait: wait
  });
};

;



const basePipe = (reverse = false) => (...funcs) => (...args) => {
  const functions = funcs.flat();
  if (reverse) {
    functions.reverse();
  }
  return functions.reduce((prev, func) => [func(...prev)], args)[0];
};


const pipe = basePipe();

 const higher_order_pipe = (pipe);

;




const compose = basePipe(true);
 const higher_order_compose = (compose);

;
const external_React_namespaceObject = window["React"];
;







function ifCondition(predicate) {
  return createHigherOrderComponent(WrappedComponent => props => {
    if (!predicate(props)) {
      return null;
    }
    return (0,external_React_namespaceObject.createElement)(WrappedComponent, {
      ...props
    });
  }, 'ifCondition');
}
 const if_condition = (ifCondition);


var external_wp_isShallowEqual_ = __webpack_require__(923);
var external_wp_isShallowEqual_default = __webpack_require__.n(external_wp_isShallowEqual_);
;
const external_wp_element_namespaceObject = window["wp"]["element"];
;











const pure = createHigherOrderComponent(function (WrappedComponent) {
  if (WrappedComponent.prototype instanceof external_wp_element_namespaceObject.Component) {
    return class extends WrappedComponent {
      shouldComponentUpdate(nextProps, nextState) {
        return !external_wp_isShallowEqual_default()(nextProps, this.props) || !external_wp_isShallowEqual_default()(nextState, this.state);
      }
    };
  }
  return class extends external_wp_element_namespaceObject.Component {
    shouldComponentUpdate(nextProps) {
      return !external_wp_isShallowEqual_default()(nextProps, this.props);
    }
    render() {
      return (0,external_React_namespaceObject.createElement)(WrappedComponent, {
        ...this.props
      });
    }
  };
}, 'pure');
 const higher_order_pure = (pure);

;
const external_wp_deprecated_namespaceObject = window["wp"]["deprecated"];
var external_wp_deprecated_default = __webpack_require__.n(external_wp_deprecated_namespaceObject);
;

class Listener {
  constructor() {
    
    this.listeners = {};
    this.handleEvent = this.handleEvent.bind(this);
  }
  add( eventType, instance) {
    if (!this.listeners[eventType]) {
      
      window.addEventListener(eventType, this.handleEvent);
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(instance);
  }
  remove( eventType, instance) {
    if (!this.listeners[eventType]) {
      return;
    }
    this.listeners[eventType] = this.listeners[eventType].filter(( listener) => listener !== instance);
    if (!this.listeners[eventType].length) {
      
      window.removeEventListener(eventType, this.handleEvent);
      delete this.listeners[eventType];
    }
  }
  handleEvent( event) {
    this.listeners[event.type]?.forEach(( instance) => {
      instance.handleEvent(event);
    });
  }
}
 const listener = (Listener);

;










const with_global_events_listener = new listener();



function withGlobalEvents(eventTypesToHandlers) {
  external_wp_deprecated_default()('wp.compose.withGlobalEvents', {
    since: '5.7',
    alternative: 'useEffect'
  });

  
  return createHigherOrderComponent(WrappedComponent => {
    class Wrapper extends external_wp_element_namespaceObject.Component {
      constructor( props) {
        super(props);
        this.handleEvent = this.handleEvent.bind(this);
        this.handleRef = this.handleRef.bind(this);
      }
      componentDidMount() {
        Object.keys(eventTypesToHandlers).forEach(eventType => {
          with_global_events_listener.add(eventType, this);
        });
      }
      componentWillUnmount() {
        Object.keys(eventTypesToHandlers).forEach(eventType => {
          with_global_events_listener.remove(eventType, this);
        });
      }
      handleEvent( event) {
        const handler = eventTypesToHandlers[( 
        event.type

        )];
        if (typeof this.wrappedRef[handler] === 'function') {
          this.wrappedRef[handler](event);
        }
      }
      handleRef( el) {
        this.wrappedRef = el;
        
        
        
        if (this.props.forwardedRef) {
          this.props.forwardedRef(el);
        }
      }
      render() {
        return (0,external_React_namespaceObject.createElement)(WrappedComponent, {
          ...this.props.ownProps,
          ref: this.handleRef
        });
      }
    }
    return (0,external_wp_element_namespaceObject.forwardRef)((props, ref) => {
      return (0,external_React_namespaceObject.createElement)(Wrapper, {
        ownProps: props,
        forwardedRef: ref
      });
    });
  }, 'withGlobalEvents');
}

;


const instanceMap = new WeakMap();


function createId(object) {
  const instances = instanceMap.get(object) || 0;
  instanceMap.set(object, instances + 1);
  return instances;
}




function useInstanceId(object, prefix, preferredId) {
  return (0,external_wp_element_namespaceObject.useMemo)(() => {
    if (preferredId) return preferredId;
    const id = createId(object);
    return prefix ? `${prefix}-${id}` : id;
  }, [object, preferredId, prefix]);
}
 const use_instance_id = (useInstanceId);

;






const withInstanceId = createHigherOrderComponent(WrappedComponent => {
  return props => {
    const instanceId = use_instance_id(WrappedComponent);
    
    return (0,external_React_namespaceObject.createElement)(WrappedComponent, {
      ...props,
      instanceId: instanceId
    });
  };
}, 'instanceId');
 const with_instance_id = (withInstanceId);

;











const withSafeTimeout = createHigherOrderComponent(OriginalComponent => {
  return class WrappedComponent extends external_wp_element_namespaceObject.Component {
    constructor(props) {
      super(props);
      this.timeouts = [];
      this.setTimeout = this.setTimeout.bind(this);
      this.clearTimeout = this.clearTimeout.bind(this);
    }
    componentWillUnmount() {
      this.timeouts.forEach(clearTimeout);
    }
    setTimeout(fn, delay) {
      const id = setTimeout(() => {
        fn();
        this.clearTimeout(id);
      }, delay);
      this.timeouts.push(id);
      return id;
    }
    clearTimeout(id) {
      clearTimeout(id);
      this.timeouts = this.timeouts.filter(timeoutId => timeoutId !== id);
    }
    render() {
      return (
        
        (0,external_React_namespaceObject.createElement)(OriginalComponent, {
          ...this.props,
          setTimeout: this.setTimeout,
          clearTimeout: this.clearTimeout
        })
      );
    }
  };
}, 'withSafeTimeout');
 const with_safe_timeout = (withSafeTimeout);

;









function withState(initialState = {}) {
  external_wp_deprecated_default()('wp.compose.withState', {
    since: '5.8',
    alternative: 'wp.element.useState'
  });
  return createHigherOrderComponent(OriginalComponent => {
    return class WrappedComponent extends external_wp_element_namespaceObject.Component {
      constructor( props) {
        super(props);
        this.setState = this.setState.bind(this);
        this.state = initialState;
      }
      render() {
        return (0,external_React_namespaceObject.createElement)(OriginalComponent, {
          ...this.props,
          ...this.state,
          setState: this.setState
        });
      }
    };
  }, 'withState');
}

;
const external_wp_dom_namespaceObject = window["wp"]["dom"];
;






function useRefEffect(callback, dependencies) {
  const cleanup = (0,external_wp_element_namespaceObject.useRef)();
  return (0,external_wp_element_namespaceObject.useCallback)(node => {
    if (node) {
      cleanup.current = callback(node);
    } else if (cleanup.current) {
      cleanup.current();
    }
  }, dependencies);
}

;







function useConstrainedTabbing() {
  return useRefEffect(( node) => {
    function onKeyDown( event) {
      const {
        key,
        shiftKey,
        target
      } = event;
      if (key !== 'Tab') {
        return;
      }
      const action = shiftKey ? 'findPrevious' : 'findNext';
      const nextElement = external_wp_dom_namespaceObject.focus.tabbable[action]( target) || null;

      
      
      
      
      
      
      if ( target.contains(nextElement)) {
        event.preventDefault();
        
        nextElement?.focus();
        return;
      }

      
      
      
      if (node.contains(nextElement)) {
        return;
      }

      
      
      
      
      const domAction = shiftKey ? 'append' : 'prepend';
      const {
        ownerDocument
      } = node;
      const trap = ownerDocument.createElement('div');
      trap.tabIndex = -1;
      node[domAction](trap);

      
      trap.addEventListener('blur', () => node.removeChild(trap));
      trap.focus();
    }
    node.addEventListener('keydown', onKeyDown);
    return () => {
      node.removeEventListener('keydown', onKeyDown);
    };
  }, []);
}
 const use_constrained_tabbing = (useConstrainedTabbing);


var dist_clipboard = __webpack_require__(3758);
var clipboard_default = __webpack_require__.n(dist_clipboard);
;









function useCopyOnClick(ref, text, timeout = 4000) {
  
  external_wp_deprecated_default()('wp.compose.useCopyOnClick', {
    since: '5.8',
    alternative: 'wp.compose.useCopyToClipboard'
  });

  
  const clipboard = (0,external_wp_element_namespaceObject.useRef)();
  const [hasCopied, setHasCopied] = (0,external_wp_element_namespaceObject.useState)(false);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    
    let timeoutId;
    if (!ref.current) {
      return;
    }

    
    clipboard.current = new (clipboard_default())(ref.current, {
      text: () => typeof text === 'function' ? text() : text
    });
    clipboard.current.on('success', ({
      clearSelection,
      trigger
    }) => {
      
      
      
      clearSelection();

      
      if (trigger) {
        trigger.focus();
      }
      if (timeout) {
        setHasCopied(true);
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => setHasCopied(false), timeout);
      }
    });
    return () => {
      if (clipboard.current) {
        clipboard.current.destroy();
      }
      clearTimeout(timeoutId);
    };
  }, [text, timeout, setHasCopied]);
  return hasCopied;
}

;










function useUpdatedRef(value) {
  const ref = (0,external_wp_element_namespaceObject.useRef)(value);
  ref.current = value;
  return ref;
}


function useCopyToClipboard(text, onSuccess) {
  
  
  const textRef = useUpdatedRef(text);
  const onSuccessRef = useUpdatedRef(onSuccess);
  return useRefEffect(node => {
    
    const clipboard = new (clipboard_default())(node, {
      text() {
        return typeof textRef.current === 'function' ? textRef.current() : textRef.current || '';
      }
    });
    clipboard.on('success', ({
      clearSelection
    }) => {
      
      
      
      clearSelection();
      if (onSuccessRef.current) {
        onSuccessRef.current();
      }
    });
    return () => {
      clipboard.destroy();
    };
  }, []);
}

;
const external_wp_keycodes_namespaceObject = window["wp"]["keycodes"];
;





function useFocusOnMount(focusOnMount = 'firstElement') {
  const focusOnMountRef = (0,external_wp_element_namespaceObject.useRef)(focusOnMount);

  
  const setFocus = target => {
    target.focus({
      
      
      
      preventScroll: true
    });
  };

  
  const timerId = (0,external_wp_element_namespaceObject.useRef)();
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    focusOnMountRef.current = focusOnMount;
  }, [focusOnMount]);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    return () => {
      if (timerId.current) {
        clearTimeout(timerId.current);
      }
    };
  }, []);
  return (0,external_wp_element_namespaceObject.useCallback)(node => {
    var _node$ownerDocument$a;
    if (!node || focusOnMountRef.current === false) {
      return;
    }
    if (node.contains((_node$ownerDocument$a = node.ownerDocument?.activeElement) !== null && _node$ownerDocument$a !== void 0 ? _node$ownerDocument$a : null)) {
      return;
    }
    if (focusOnMountRef.current === 'firstElement') {
      timerId.current = setTimeout(() => {
        const firstTabbable = external_wp_dom_namespaceObject.focus.tabbable.find(node)[0];
        if (firstTabbable) {
          setFocus( firstTabbable);
        }
      }, 0);
      return;
    }
    setFocus(node);
  }, []);
}

;




let origin = null;


function useFocusReturn(onFocusReturn) {
  
  const ref = (0,external_wp_element_namespaceObject.useRef)(null);
  
  const focusedBeforeMount = (0,external_wp_element_namespaceObject.useRef)(null);
  const onFocusReturnRef = (0,external_wp_element_namespaceObject.useRef)(onFocusReturn);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    onFocusReturnRef.current = onFocusReturn;
  }, [onFocusReturn]);
  return (0,external_wp_element_namespaceObject.useCallback)(node => {
    if (node) {
      
      ref.current = node;

      
      if (focusedBeforeMount.current) {
        return;
      }
      focusedBeforeMount.current = node.ownerDocument.activeElement;
    } else if (focusedBeforeMount.current) {
      const isFocused = ref.current?.contains(ref.current?.ownerDocument.activeElement);
      if (ref.current?.isConnected && !isFocused) {
        var _origin;
        (_origin = origin) !== null && _origin !== void 0 ? _origin : origin = focusedBeforeMount.current;
        return;
      }

      
      
      
      
      if (onFocusReturnRef.current) {
        onFocusReturnRef.current();
      } else {
        (!focusedBeforeMount.current.isConnected ? origin : focusedBeforeMount.current)?.focus();
      }
      origin = null;
    }
  }, []);
}
 const use_focus_return = (useFocusReturn);

;




const INPUT_BUTTON_TYPES = ['button', 'submit'];




function isFocusNormalizedButton(eventTarget) {
  if (!(eventTarget instanceof window.HTMLElement)) {
    return false;
  }
  switch (eventTarget.nodeName) {
    case 'A':
    case 'BUTTON':
      return true;
    case 'INPUT':
      return INPUT_BUTTON_TYPES.includes(eventTarget.type);
  }
  return false;
}

function useFocusOutside(onFocusOutside) {
  const currentOnFocusOutside = (0,external_wp_element_namespaceObject.useRef)(onFocusOutside);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    currentOnFocusOutside.current = onFocusOutside;
  }, [onFocusOutside]);
  const preventBlurCheck = (0,external_wp_element_namespaceObject.useRef)(false);
  const blurCheckTimeoutId = (0,external_wp_element_namespaceObject.useRef)();

  
  const cancelBlurCheck = (0,external_wp_element_namespaceObject.useCallback)(() => {
    clearTimeout(blurCheckTimeoutId.current);
  }, []);

  
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    return () => cancelBlurCheck();
  }, []);

  
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (!onFocusOutside) {
      cancelBlurCheck();
    }
  }, [onFocusOutside, cancelBlurCheck]);

  
  const normalizeButtonFocus = (0,external_wp_element_namespaceObject.useCallback)(event => {
    const {
      type,
      target
    } = event;
    const isInteractionEnd = ['mouseup', 'touchend'].includes(type);
    if (isInteractionEnd) {
      preventBlurCheck.current = false;
    } else if (isFocusNormalizedButton(target)) {
      preventBlurCheck.current = true;
    }
  }, []);

  
  const queueBlurCheck = (0,external_wp_element_namespaceObject.useCallback)(event => {
    
    
    event.persist();

    
    if (preventBlurCheck.current) {
      return;
    }

    
    
    
    
    
    
    
    const ignoreForRelatedTarget = event.target.getAttribute('data-unstable-ignore-focus-outside-for-relatedtarget');
    if (ignoreForRelatedTarget && event.relatedTarget?.closest(ignoreForRelatedTarget)) {
      return;
    }
    blurCheckTimeoutId.current = setTimeout(() => {
      
      
      
      
      if (!document.hasFocus()) {
        event.preventDefault();
        return;
      }
      if ('function' === typeof currentOnFocusOutside.current) {
        currentOnFocusOutside.current(event);
      }
    }, 0);
  }, []);
  return {
    onFocus: cancelBlurCheck,
    onMouseDown: normalizeButtonFocus,
    onMouseUp: normalizeButtonFocus,
    onTouchStart: normalizeButtonFocus,
    onTouchEnd: normalizeButtonFocus,
    onBlur: queueBlurCheck
  };
}

;








function assignRef(ref, value) {
  if (typeof ref === 'function') {
    ref(value);
  } else if (ref && ref.hasOwnProperty('current')) {
    
    ref.current = value;
    
  }
}


function useMergeRefs(refs) {
  const element = (0,external_wp_element_namespaceObject.useRef)();
  const isAttached = (0,external_wp_element_namespaceObject.useRef)(false);
  const didElementChange = (0,external_wp_element_namespaceObject.useRef)(false);
  
  
  
  const previousRefs = (0,external_wp_element_namespaceObject.useRef)([]);
  const currentRefs = (0,external_wp_element_namespaceObject.useRef)(refs);

  
  
  currentRefs.current = refs;

  
  
  
  (0,external_wp_element_namespaceObject.useLayoutEffect)(() => {
    if (didElementChange.current === false && isAttached.current === true) {
      refs.forEach((ref, index) => {
        const previousRef = previousRefs.current[index];
        if (ref !== previousRef) {
          assignRef(previousRef, null);
          assignRef(ref, element.current);
        }
      });
    }
    previousRefs.current = refs;
  }, refs);

  
  
  (0,external_wp_element_namespaceObject.useLayoutEffect)(() => {
    didElementChange.current = false;
  });

  
  
  return (0,external_wp_element_namespaceObject.useCallback)(value => {
    
    
    assignRef(element, value);
    didElementChange.current = true;
    isAttached.current = value !== null;

    
    
    const refsToAssign = value ? currentRefs.current : previousRefs.current;

    
    for (const ref of refsToAssign) {
      assignRef(ref, value);
    }
  }, []);
}

;













function useDialog(options) {
  const currentOptions = (0,external_wp_element_namespaceObject.useRef)();
  const {
    constrainTabbing = options.focusOnMount !== false
  } = options;
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    currentOptions.current = options;
  }, Object.values(options));
  const constrainedTabbingRef = use_constrained_tabbing();
  const focusOnMountRef = useFocusOnMount(options.focusOnMount);
  const focusReturnRef = use_focus_return();
  const focusOutsideProps = useFocusOutside(event => {
    
    
    if (currentOptions.current?.__unstableOnClose) {
      currentOptions.current.__unstableOnClose('focus-outside', event);
    } else if (currentOptions.current?.onClose) {
      currentOptions.current.onClose();
    }
  });
  const closeOnEscapeRef = (0,external_wp_element_namespaceObject.useCallback)(node => {
    if (!node) {
      return;
    }
    node.addEventListener('keydown', event => {
      
      if (event.keyCode === external_wp_keycodes_namespaceObject.ESCAPE && !event.defaultPrevented && currentOptions.current?.onClose) {
        event.preventDefault();
        currentOptions.current.onClose();
      }
    });
  }, []);
  return [useMergeRefs([constrainTabbing ? constrainedTabbingRef : null, options.focusOnMount !== false ? focusReturnRef : null, options.focusOnMount !== false ? focusOnMountRef : null, closeOnEscapeRef]), {
    ...focusOutsideProps,
    tabIndex: -1
  }];
}
 const use_dialog = (useDialog);

;





function useDisabled({
  isDisabled: isDisabledProp = false
} = {}) {
  return useRefEffect(node => {
    if (isDisabledProp) {
      return;
    }
    const defaultView = node?.ownerDocument?.defaultView;
    if (!defaultView) {
      return;
    }

    
    const updates = [];
    const disable = () => {
      node.childNodes.forEach(child => {
        if (!(child instanceof defaultView.HTMLElement)) {
          return;
        }
        if (!child.getAttribute('inert')) {
          child.setAttribute('inert', 'true');
          updates.push(() => {
            child.removeAttribute('inert');
          });
        }
      });
    };

    
    
    const debouncedDisable = debounce(disable, 0, {
      leading: true
    });
    disable();

    
    const observer = new window.MutationObserver(debouncedDisable);
    observer.observe(node, {
      childList: true
    });
    return () => {
      if (observer) {
        observer.disconnect();
      }
      debouncedDisable.cancel();
      updates.forEach(update => update());
    };
  }, [isDisabledProp]);
}

;




const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? external_wp_element_namespaceObject.useLayoutEffect : external_wp_element_namespaceObject.useEffect;
 const use_isomorphic_layout_effect = (useIsomorphicLayoutEffect);

;









function useDragging({
  onDragStart,
  onDragMove,
  onDragEnd
}) {
  const [isDragging, setIsDragging] = (0,external_wp_element_namespaceObject.useState)(false);
  const eventsRef = (0,external_wp_element_namespaceObject.useRef)({
    onDragStart,
    onDragMove,
    onDragEnd
  });
  use_isomorphic_layout_effect(() => {
    eventsRef.current.onDragStart = onDragStart;
    eventsRef.current.onDragMove = onDragMove;
    eventsRef.current.onDragEnd = onDragEnd;
  }, [onDragStart, onDragMove, onDragEnd]);

  
  const onMouseMove = (0,external_wp_element_namespaceObject.useCallback)(event => eventsRef.current.onDragMove && eventsRef.current.onDragMove(event), []);
  
  const endDrag = (0,external_wp_element_namespaceObject.useCallback)(event => {
    if (eventsRef.current.onDragEnd) {
      eventsRef.current.onDragEnd(event);
    }
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', endDrag);
    setIsDragging(false);
  }, []);
  
  const startDrag = (0,external_wp_element_namespaceObject.useCallback)(event => {
    if (eventsRef.current.onDragStart) {
      eventsRef.current.onDragStart(event);
    }
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', endDrag);
    setIsDragging(true);
  }, []);

  
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    return () => {
      if (isDragging) {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', endDrag);
      }
    };
  }, [isDragging]);
  return {
    startDrag,
    endDrag,
    isDragging
  };
}


var mousetrap_mousetrap = __webpack_require__(1933);
var mousetrap_default = __webpack_require__.n(mousetrap_mousetrap);

var mousetrap_global_bind = __webpack_require__(5760);
;












function useKeyboardShortcut( 
shortcuts, callback, {
  bindGlobal = false,
  eventName = 'keydown',
  isDisabled = false,
  
  target
} = {}) {
  const currentCallback = (0,external_wp_element_namespaceObject.useRef)(callback);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    currentCallback.current = callback;
  }, [callback]);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    if (isDisabled) {
      return;
    }
    const mousetrap = new (mousetrap_default())(target && target.current ? target.current :
    
    
    
     
    document);
    const shortcutsArray = Array.isArray(shortcuts) ? shortcuts : [shortcuts];
    shortcutsArray.forEach(shortcut => {
      const keys = shortcut.split('+');
      
      
      
      const modifiers = new Set(keys.filter(value => value.length > 1));
      const hasAlt = modifiers.has('alt');
      const hasShift = modifiers.has('shift');

      
      if ((0,external_wp_keycodes_namespaceObject.isAppleOS)() && (modifiers.size === 1 && hasAlt || modifiers.size === 2 && hasAlt && hasShift)) {
        throw new Error(`Cannot bind ${shortcut}. Alt and Shift+Alt modifiers are reserved for character input.`);
      }
      const bindFn = bindGlobal ? 'bindGlobal' : 'bind';
      
      mousetrap[bindFn](shortcut, ( 
      ...args) => 
      currentCallback.current(...args), eventName);
    });
    return () => {
      mousetrap.reset();
    };
  }, [shortcuts, bindGlobal, eventName, target, isDisabled]);
}
 const use_keyboard_shortcut = (useKeyboardShortcut);

;




function getMediaQueryList(query) {
  if (query && typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    return window.matchMedia(query);
  }
  return null;
}


function useMediaQuery(query) {
  const source = (0,external_wp_element_namespaceObject.useMemo)(() => {
    const mediaQueryList = getMediaQueryList(query);
    return {
      
      subscribe(onStoreChange) {
        if (!mediaQueryList) {
          return () => {};
        }

        
        mediaQueryList.addEventListener?.('change', onStoreChange);
        return () => {
          mediaQueryList.removeEventListener?.('change', onStoreChange);
        };
      },
      getValue() {
        var _mediaQueryList$match;
        return (_mediaQueryList$match = mediaQueryList?.matches) !== null && _mediaQueryList$match !== void 0 ? _mediaQueryList$match : false;
      }
    };
  }, [query]);
  return (0,external_wp_element_namespaceObject.useSyncExternalStore)(source.subscribe, source.getValue, () => false);
}

;




function usePrevious(value) {
  const ref = (0,external_wp_element_namespaceObject.useRef)();

  
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    ref.current = value;
  }, [value]); 

  
  return ref.current;
}

;




const useReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');
 const use_reduced_motion = (useReducedMotion);


var build_module = __webpack_require__(6689);
;



function undoRedoReducer(state, action) {
  switch (action.type) {
    case 'UNDO':
      {
        const undoRecord = state.manager.undo();
        if (undoRecord) {
          return {
            ...state,
            value: undoRecord[0].changes.prop.from
          };
        }
        return state;
      }
    case 'REDO':
      {
        const redoRecord = state.manager.redo();
        if (redoRecord) {
          return {
            ...state,
            value: redoRecord[0].changes.prop.to
          };
        }
        return state;
      }
    case 'RECORD':
      {
        state.manager.addRecord([{
          id: 'object',
          changes: {
            prop: {
              from: state.value,
              to: action.value
            }
          }
        }], action.isStaged);
        return {
          ...state,
          value: action.value
        };
      }
  }
  return state;
}
function initReducer(value) {
  return {
    manager: (0,build_module.createUndoManager)(),
    value
  };
}


function useStateWithHistory(initialValue) {
  const [state, dispatch] = (0,external_wp_element_namespaceObject.useReducer)(undoRedoReducer, initialValue, initReducer);
  return {
    value: state.value,
    setValue: (0,external_wp_element_namespaceObject.useCallback)((newValue, isStaged) => {
      dispatch({
        type: 'RECORD',
        value: newValue,
        isStaged
      });
    }, []),
    hasUndo: state.manager.hasUndo(),
    hasRedo: state.manager.hasRedo(),
    undo: (0,external_wp_element_namespaceObject.useCallback)(() => {
      dispatch({
        type: 'UNDO'
      });
    }, []),
    redo: (0,external_wp_element_namespaceObject.useCallback)(() => {
      dispatch({
        type: 'REDO'
      });
    }, [])
  };
}

;









const BREAKPOINTS = {
  huge: 1440,
  wide: 1280,
  large: 960,
  medium: 782,
  small: 600,
  mobile: 480
};




const CONDITIONS = {
  '>=': 'min-width',
  '<': 'max-width'
};


const OPERATOR_EVALUATORS = {
  '>=': (breakpointValue, width) => width >= breakpointValue,
  '<': (breakpointValue, width) => width < breakpointValue
};
const ViewportMatchWidthContext = (0,external_wp_element_namespaceObject.createContext)( null);


const useViewportMatch = (breakpoint, operator = '>=') => {
  const simulatedWidth = (0,external_wp_element_namespaceObject.useContext)(ViewportMatchWidthContext);
  const mediaQuery = !simulatedWidth && `(${CONDITIONS[operator]}: ${BREAKPOINTS[breakpoint]}px)`;
  const mediaQueryResult = useMediaQuery(mediaQuery || undefined);
  if (simulatedWidth) {
    return OPERATOR_EVALUATORS[operator](BREAKPOINTS[breakpoint], simulatedWidth);
  }
  return mediaQueryResult;
};
useViewportMatch.__experimentalWidthProvider = ViewportMatchWidthContext.Provider;
 const use_viewport_match = (useViewportMatch);

;









function useResolvedElement(subscriber, refOrElement) {
  const callbackRefElement = (0,external_wp_element_namespaceObject.useRef)(null);
  const lastReportRef = (0,external_wp_element_namespaceObject.useRef)(null);
  const cleanupRef = (0,external_wp_element_namespaceObject.useRef)();
  const callSubscriber = (0,external_wp_element_namespaceObject.useCallback)(() => {
    let element = null;
    if (callbackRefElement.current) {
      element = callbackRefElement.current;
    } else if (refOrElement) {
      if (refOrElement instanceof HTMLElement) {
        element = refOrElement;
      } else {
        element = refOrElement.current;
      }
    }
    if (lastReportRef.current && lastReportRef.current.element === element && lastReportRef.current.reporter === callSubscriber) {
      return;
    }
    if (cleanupRef.current) {
      cleanupRef.current();
      
      cleanupRef.current = null;
    }
    lastReportRef.current = {
      reporter: callSubscriber,
      element
    };

    
    if (element) {
      cleanupRef.current = subscriber(element);
    }
  }, [refOrElement, subscriber]);

  
  
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    
    
    
    
    callSubscriber();
  }, [callSubscriber]);
  return (0,external_wp_element_namespaceObject.useCallback)(element => {
    callbackRefElement.current = element;
    callSubscriber();
  }, [callSubscriber]);
}

























const extractSize = (entry, boxProp, sizeType) => {
  if (!entry[boxProp]) {
    if (boxProp === 'contentBoxSize') {
      
      
      
      
      
      return entry.contentRect[sizeType === 'inlineSize' ? 'width' : 'height'];
    }
    return undefined;
  }

  
  return entry[boxProp][0] ? entry[boxProp][0][sizeType] :
  
  
  
  entry[boxProp][sizeType];
};
function useResizeObserver(opts = {}) {
  
  
  
  const onResize = opts.onResize;
  const onResizeRef = (0,external_wp_element_namespaceObject.useRef)(undefined);
  onResizeRef.current = onResize;
  const round = opts.round || Math.round;

  
  const resizeObserverRef = (0,external_wp_element_namespaceObject.useRef)();
  const [size, setSize] = (0,external_wp_element_namespaceObject.useState)({
    width: undefined,
    height: undefined
  });

  
  
  const didUnmount = (0,external_wp_element_namespaceObject.useRef)(false);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    didUnmount.current = false;
    return () => {
      didUnmount.current = true;
    };
  }, []);

  
  const previous = (0,external_wp_element_namespaceObject.useRef)({
    width: undefined,
    height: undefined
  });

  
  
  
  const refCallback = useResolvedElement((0,external_wp_element_namespaceObject.useCallback)(element => {
    
    
    if (!resizeObserverRef.current || resizeObserverRef.current.box !== opts.box || resizeObserverRef.current.round !== round) {
      resizeObserverRef.current = {
        box: opts.box,
        round,
        instance: new ResizeObserver(entries => {
          const entry = entries[0];
          let boxProp = 'borderBoxSize';
          if (opts.box === 'border-box') {
            boxProp = 'borderBoxSize';
          } else {
            boxProp = opts.box === 'device-pixel-content-box' ? 'devicePixelContentBoxSize' : 'contentBoxSize';
          }
          const reportedWidth = extractSize(entry, boxProp, 'inlineSize');
          const reportedHeight = extractSize(entry, boxProp, 'blockSize');
          const newWidth = reportedWidth ? round(reportedWidth) : undefined;
          const newHeight = reportedHeight ? round(reportedHeight) : undefined;
          if (previous.current.width !== newWidth || previous.current.height !== newHeight) {
            const newSize = {
              width: newWidth,
              height: newHeight
            };
            previous.current.width = newWidth;
            previous.current.height = newHeight;
            if (onResizeRef.current) {
              onResizeRef.current(newSize);
            } else if (!didUnmount.current) {
              setSize(newSize);
            }
          }
        })
      };
    }
    resizeObserverRef.current.instance.observe(element, {
      box: opts.box
    });
    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.instance.unobserve(element);
      }
    };
  }, [opts.box, round]), opts.ref);
  return (0,external_wp_element_namespaceObject.useMemo)(() => ({
    ref: refCallback,
    width: size.width,
    height: size.height
  }), [refCallback, size ? size.width : null, size ? size.height : null]);
}


function useResizeAware() {
  const {
    ref,
    width,
    height
  } = useResizeObserver();
  const sizes = (0,external_wp_element_namespaceObject.useMemo)(() => {
    return {
      width: width !== null && width !== void 0 ? width : null,
      height: height !== null && height !== void 0 ? height : null
    };
  }, [width, height]);
  const resizeListener = (0,external_React_namespaceObject.createElement)("div", {
    style: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      opacity: 0,
      overflow: 'hidden',
      zIndex: -1
    },
    "aria-hidden": "true",
    ref: ref
  });
  return [resizeListener, sizes];
}

;
const external_wp_priorityQueue_namespaceObject = window["wp"]["priorityQueue"];
;




function getFirstItemsPresentInState(list, state) {
  const firstItems = [];
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (!state.includes(item)) {
      break;
    }
    firstItems.push(item);
  }
  return firstItems;
}


function useAsyncList(list, config = {
  step: 1
}) {
  const {
    step = 1
  } = config;
  const [current, setCurrent] = (0,external_wp_element_namespaceObject.useState)([]);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    
    let firstItems = getFirstItemsPresentInState(list, current);
    if (firstItems.length < step) {
      firstItems = firstItems.concat(list.slice(firstItems.length, step));
    }
    setCurrent(firstItems);
    const asyncQueue = (0,external_wp_priorityQueue_namespaceObject.createQueue)();
    for (let i = firstItems.length; i < list.length; i += step) {
      asyncQueue.add({}, () => {
        (0,external_wp_element_namespaceObject.flushSync)(() => {
          setCurrent(state => [...state, ...list.slice(i, i + step)]);
        });
      });
    }
    return () => asyncQueue.reset();
  }, [list]);
  return current;
}
 const use_async_list = (useAsyncList);

;







function useWarnOnChange(object, prefix = 'Change detection') {
  const previousValues = usePrevious(object);
  Object.entries(previousValues !== null && previousValues !== void 0 ? previousValues : []).forEach(([key, value]) => {
    if (value !== object[( key)]) {
      
      console.warn(`${prefix}: ${key} key changed:`, value, object[( key)]
      );
    }
  });
}
 const use_warn_on_change = (useWarnOnChange);

;


function areInputsEqual(newInputs, lastInputs) {
  if (newInputs.length !== lastInputs.length) {
    return false;
  }

  for (var i = 0; i < newInputs.length; i++) {
    if (newInputs[i] !== lastInputs[i]) {
      return false;
    }
  }

  return true;
}

function useMemoOne(getResult, inputs) {
  var initial = (0,external_React_namespaceObject.useState)(function () {
    return {
      inputs: inputs,
      result: getResult()
    };
  })[0];
  var isFirstRun = (0,external_React_namespaceObject.useRef)(true);
  var committed = (0,external_React_namespaceObject.useRef)(initial);
  var useCache = isFirstRun.current || Boolean(inputs && committed.current.inputs && areInputsEqual(inputs, committed.current.inputs));
  var cache = useCache ? committed.current : {
    inputs: inputs,
    result: getResult()
  };
  (0,external_React_namespaceObject.useEffect)(function () {
    isFirstRun.current = false;
    committed.current = cache;
  }, [cache]);
  return cache.result;
}
function useCallbackOne(callback, inputs) {
  return useMemoOne(function () {
    return callback;
  }, inputs);
}
var useMemo = ( null && (useMemoOne));
var useCallback = ( null && (useCallbackOne));



;










function useDebounce(fn, wait, options) {
  const debounced = useMemoOne(() => debounce(fn, wait !== null && wait !== void 0 ? wait : 0, options), [fn, wait, options]);
  (0,external_wp_element_namespaceObject.useEffect)(() => () => debounced.cancel(), [debounced]);
  return debounced;
}

;







function useDebouncedInput(defaultValue = '') {
  const [input, setInput] = (0,external_wp_element_namespaceObject.useState)(defaultValue);
  const [debouncedInput, setDebouncedState] = (0,external_wp_element_namespaceObject.useState)(defaultValue);
  const setDebouncedInput = useDebounce(setDebouncedState, 250);
  (0,external_wp_element_namespaceObject.useEffect)(() => {
    setDebouncedInput(input);
  }, [input]);
  return [input, setInput, debouncedInput];
}

;










function useThrottle(fn, wait, options) {
  const throttled = useMemoOne(() => throttle(fn, wait !== null && wait !== void 0 ? wait : 0, options), [fn, wait, options]);
  (0,external_wp_element_namespaceObject.useEffect)(() => () => throttled.cancel(), [throttled]);
  return throttled;
}

;








function useFreshRef(value) {
  
  
  
  
  
  
  
  
  
  
  const ref = (0,external_wp_element_namespaceObject.useRef)();
  ref.current = value;
  return ref;
}


function useDropZone({
  dropZoneElement,
  isDisabled,
  onDrop: _onDrop,
  onDragStart: _onDragStart,
  onDragEnter: _onDragEnter,
  onDragLeave: _onDragLeave,
  onDragEnd: _onDragEnd,
  onDragOver: _onDragOver
}) {
  const onDropRef = useFreshRef(_onDrop);
  const onDragStartRef = useFreshRef(_onDragStart);
  const onDragEnterRef = useFreshRef(_onDragEnter);
  const onDragLeaveRef = useFreshRef(_onDragLeave);
  const onDragEndRef = useFreshRef(_onDragEnd);
  const onDragOverRef = useFreshRef(_onDragOver);
  return useRefEffect(elem => {
    if (isDisabled) {
      return;
    }

    
    
    
    const element = dropZoneElement !== null && dropZoneElement !== void 0 ? dropZoneElement : elem;
    let isDragging = false;
    const {
      ownerDocument
    } = element;

    
    function isElementInZone(targetToCheck) {
      const {
        defaultView
      } = ownerDocument;
      if (!targetToCheck || !defaultView || !(targetToCheck instanceof defaultView.HTMLElement) || !element.contains(targetToCheck)) {
        return false;
      }

      
      let elementToCheck = targetToCheck;
      do {
        if (elementToCheck.dataset.isDropZone) {
          return elementToCheck === element;
        }
      } while (elementToCheck = elementToCheck.parentElement);
      return false;
    }
    function maybeDragStart( event) {
      if (isDragging) {
        return;
      }
      isDragging = true;

      
      
      
      
      ownerDocument.addEventListener('dragend', maybeDragEnd);
      ownerDocument.addEventListener('mousemove', maybeDragEnd);
      if (onDragStartRef.current) {
        onDragStartRef.current(event);
      }
    }
    function onDragEnter( event) {
      event.preventDefault();

      
      
      
      
      if (element.contains( event.relatedTarget)) {
        return;
      }
      if (onDragEnterRef.current) {
        onDragEnterRef.current(event);
      }
    }
    function onDragOver( event) {
      
      if (!event.defaultPrevented && onDragOverRef.current) {
        onDragOverRef.current(event);
      }

      
      
      event.preventDefault();
    }
    function onDragLeave( event) {
      
      
      
      
      
      
      
      if (isElementInZone(event.relatedTarget)) {
        return;
      }
      if (onDragLeaveRef.current) {
        onDragLeaveRef.current(event);
      }
    }
    function onDrop( event) {
      
      if (event.defaultPrevented) {
        return;
      }

      
      
      event.preventDefault();

      
      
      
      
      event.dataTransfer && event.dataTransfer.files.length;
      if (onDropRef.current) {
        onDropRef.current(event);
      }
      maybeDragEnd(event);
    }
    function maybeDragEnd( event) {
      if (!isDragging) {
        return;
      }
      isDragging = false;
      ownerDocument.removeEventListener('dragend', maybeDragEnd);
      ownerDocument.removeEventListener('mousemove', maybeDragEnd);
      if (onDragEndRef.current) {
        onDragEndRef.current(event);
      }
    }
    element.dataset.isDropZone = 'true';
    element.addEventListener('drop', onDrop);
    element.addEventListener('dragenter', onDragEnter);
    element.addEventListener('dragover', onDragOver);
    element.addEventListener('dragleave', onDragLeave);
    
    
    ownerDocument.addEventListener('dragenter', maybeDragStart);
    return () => {
      delete element.dataset.isDropZone;
      element.removeEventListener('drop', onDrop);
      element.removeEventListener('dragenter', onDragEnter);
      element.removeEventListener('dragover', onDragOver);
      element.removeEventListener('dragleave', onDragLeave);
      ownerDocument.removeEventListener('dragend', maybeDragEnd);
      ownerDocument.removeEventListener('mousemove', maybeDragEnd);
      ownerDocument.removeEventListener('dragenter', maybeDragStart);
    };
  }, [isDisabled, dropZoneElement] 
  );
}

;






function useFocusableIframe() {
  return useRefEffect(element => {
    const {
      ownerDocument
    } = element;
    if (!ownerDocument) return;
    const {
      defaultView
    } = ownerDocument;
    if (!defaultView) return;

    
    function checkFocus() {
      if (ownerDocument && ownerDocument.activeElement === element) {
        element.focus();
      }
    }
    defaultView.addEventListener('blur', checkFocus);
    return () => {
      defaultView.removeEventListener('blur', checkFocus);
    };
  }, []);
}

;







const DEFAULT_INIT_WINDOW_SIZE = 30;






function useFixedWindowList(elementRef, itemHeight, totalItems, options) {
  var _options$initWindowSi, _options$useWindowing;
  const initWindowSize = (_options$initWindowSi = options?.initWindowSize) !== null && _options$initWindowSi !== void 0 ? _options$initWindowSi : DEFAULT_INIT_WINDOW_SIZE;
  const useWindowing = (_options$useWindowing = options?.useWindowing) !== null && _options$useWindowing !== void 0 ? _options$useWindowing : true;
  const [fixedListWindow, setFixedListWindow] = (0,external_wp_element_namespaceObject.useState)({
    visibleItems: initWindowSize,
    start: 0,
    end: initWindowSize,
    itemInView: ( index) => {
      return index >= 0 && index <= initWindowSize;
    }
  });
  (0,external_wp_element_namespaceObject.useLayoutEffect)(() => {
    if (!useWindowing) {
      return;
    }
    const scrollContainer = (0,external_wp_dom_namespaceObject.getScrollContainer)(elementRef.current);
    const measureWindow = ( initRender) => {
      var _options$windowOversc;
      if (!scrollContainer) {
        return;
      }
      const visibleItems = Math.ceil(scrollContainer.clientHeight / itemHeight);
      
      const windowOverscan = initRender ? visibleItems : (_options$windowOversc = options?.windowOverscan) !== null && _options$windowOversc !== void 0 ? _options$windowOversc : visibleItems;
      const firstViewableIndex = Math.floor(scrollContainer.scrollTop / itemHeight);
      const start = Math.max(0, firstViewableIndex - windowOverscan);
      const end = Math.min(totalItems - 1, firstViewableIndex + visibleItems + windowOverscan);
      setFixedListWindow(lastWindow => {
        const nextWindow = {
          visibleItems,
          start,
          end,
          itemInView: ( index) => {
            return start <= index && index <= end;
          }
        };
        if (lastWindow.start !== nextWindow.start || lastWindow.end !== nextWindow.end || lastWindow.visibleItems !== nextWindow.visibleItems) {
          return nextWindow;
        }
        return lastWindow;
      });
    };
    measureWindow(true);
    const debounceMeasureList = debounce(() => {
      measureWindow();
    }, 16);
    scrollContainer?.addEventListener('scroll', debounceMeasureList);
    scrollContainer?.ownerDocument?.defaultView?.addEventListener('resize', debounceMeasureList);
    scrollContainer?.ownerDocument?.defaultView?.addEventListener('resize', debounceMeasureList);
    return () => {
      scrollContainer?.removeEventListener('scroll', debounceMeasureList);
      scrollContainer?.ownerDocument?.defaultView?.removeEventListener('resize', debounceMeasureList);
    };
  }, [itemHeight, elementRef, totalItems, options?.expandedState, options?.windowOverscan, useWindowing]);
  (0,external_wp_element_namespaceObject.useLayoutEffect)(() => {
    if (!useWindowing) {
      return;
    }
    const scrollContainer = (0,external_wp_dom_namespaceObject.getScrollContainer)(elementRef.current);
    const handleKeyDown = ( event) => {
      switch (event.keyCode) {
        case external_wp_keycodes_namespaceObject.HOME:
          {
            return scrollContainer?.scrollTo({
              top: 0
            });
          }
        case external_wp_keycodes_namespaceObject.END:
          {
            return scrollContainer?.scrollTo({
              top: totalItems * itemHeight
            });
          }
        case external_wp_keycodes_namespaceObject.PAGEUP:
          {
            return scrollContainer?.scrollTo({
              top: scrollContainer.scrollTop - fixedListWindow.visibleItems * itemHeight
            });
          }
        case external_wp_keycodes_namespaceObject.PAGEDOWN:
          {
            return scrollContainer?.scrollTo({
              top: scrollContainer.scrollTop + fixedListWindow.visibleItems * itemHeight
            });
          }
      }
    };
    scrollContainer?.ownerDocument?.defaultView?.addEventListener('keydown', handleKeyDown);
    return () => {
      scrollContainer?.ownerDocument?.defaultView?.removeEventListener('keydown', handleKeyDown);
    };
  }, [totalItems, itemHeight, elementRef, fixedListWindow.visibleItems, useWindowing, options?.expandedState]);
  return [fixedListWindow, setFixedListWindow];
}

;

















































})();

(window.wp = window.wp || {}).compose = __webpack_exports__;
 })()
;