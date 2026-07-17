 (() => { 
 	"use strict";
 	var __webpack_modules__ = ({

 66:
 ((module) => {



var isMergeableObject = function isMergeableObject(value) {
	return isNonNullObject(value)
		&& !isSpecial(value)
};

function isNonNullObject(value) {
	return !!value && typeof value === 'object'
}

function isSpecial(value) {
	var stringValue = Object.prototype.toString.call(value);

	return stringValue === '[object RegExp]'
		|| stringValue === '[object Date]'
		|| isReactElement(value)
}


var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

function isReactElement(value) {
	return value.$$typeof === REACT_ELEMENT_TYPE
}

function emptyTarget(val) {
	return Array.isArray(val) ? [] : {}
}

function cloneUnlessOtherwiseSpecified(value, options) {
	return (options.clone !== false && options.isMergeableObject(value))
		? deepmerge(emptyTarget(value), value, options)
		: value
}

function defaultArrayMerge(target, source, options) {
	return target.concat(source).map(function(element) {
		return cloneUnlessOtherwiseSpecified(element, options)
	})
}

function getMergeFunction(key, options) {
	if (!options.customMerge) {
		return deepmerge
	}
	var customMerge = options.customMerge(key);
	return typeof customMerge === 'function' ? customMerge : deepmerge
}

function getEnumerableOwnPropertySymbols(target) {
	return Object.getOwnPropertySymbols
		? Object.getOwnPropertySymbols(target).filter(function(symbol) {
			return Object.propertyIsEnumerable.call(target, symbol)
		})
		: []
}

function getKeys(target) {
	return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
}

function propertyIsOnObject(object, property) {
	try {
		return property in object
	} catch(_) {
		return false
	}
}


function propertyIsUnsafe(target, key) {
	return propertyIsOnObject(target, key) 
		&& !(Object.hasOwnProperty.call(target, key) 
			&& Object.propertyIsEnumerable.call(target, key)) 
}

function mergeObject(target, source, options) {
	var destination = {};
	if (options.isMergeableObject(target)) {
		getKeys(target).forEach(function(key) {
			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
		});
	}
	getKeys(source).forEach(function(key) {
		if (propertyIsUnsafe(target, key)) {
			return
		}

		if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
			destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
		} else {
			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
		}
	});
	return destination
}

function deepmerge(target, source, options) {
	options = options || {};
	options.arrayMerge = options.arrayMerge || defaultArrayMerge;
	options.isMergeableObject = options.isMergeableObject || isMergeableObject;
	
	
	options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

	var sourceIsArray = Array.isArray(source);
	var targetIsArray = Array.isArray(target);
	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

	if (!sourceAndTargetTypesMatch) {
		return cloneUnlessOtherwiseSpecified(source, options)
	} else if (sourceIsArray) {
		return options.arrayMerge(target, source, options)
	} else {
		return mergeObject(target, source, options)
	}
}

deepmerge.all = function deepmergeAll(array, options) {
	if (!Array.isArray(array)) {
		throw new Error('first argument should be an array')
	}

	return array.reduce(function(prev, next) {
		return deepmerge(prev, next, options)
	}, {})
};

var deepmerge_1 = deepmerge;

module.exports = deepmerge_1;


 }),

 3249:
 ((module) => {



function _typeof(obj) {
  if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
    _typeof = function (obj) {
      return typeof obj;
    };
  } else {
    _typeof = function (obj) {
      return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
    };
  }

  return _typeof(obj);
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}


function getValuePair(instance, key) {
  var _map = instance._map,
      _arrayTreeMap = instance._arrayTreeMap,
      _objectTreeMap = instance._objectTreeMap; 
  

  if (_map.has(key)) {
    return _map.get(key);
  } 


  var properties = Object.keys(key).sort(); 

  var map = Array.isArray(key) ? _arrayTreeMap : _objectTreeMap;

  for (var i = 0; i < properties.length; i++) {
    var property = properties[i];
    map = map.get(property);

    if (map === undefined) {
      return;
    }

    var propertyValue = key[property];
    map = map.get(propertyValue);

    if (map === undefined) {
      return;
    }
  }

  var valuePair = map.get('_ekm_value');

  if (!valuePair) {
    return;
  } 
  


  _map.delete(valuePair[0]);

  valuePair[0] = key;
  map.set('_ekm_value', valuePair);

  _map.set(key, valuePair);

  return valuePair;
}



var EquivalentKeyMap =

function () {
  
  function EquivalentKeyMap(iterable) {
    _classCallCheck(this, EquivalentKeyMap);

    this.clear();

    if (iterable instanceof EquivalentKeyMap) {
      
      var iterablePairs = [];
      iterable.forEach(function (value, key) {
        iterablePairs.push([key, value]);
      });
      iterable = iterablePairs;
    }

    if (iterable != null) {
      for (var i = 0; i < iterable.length; i++) {
        this.set(iterable[i][0], iterable[i][1]);
      }
    }
  }
  


  _createClass(EquivalentKeyMap, [{
    key: "set",

    
    value: function set(key, value) {
      
      if (key === null || _typeof(key) !== 'object') {
        this._map.set(key, value);

        return this;
      } 


      var properties = Object.keys(key).sort();
      var valuePair = [key, value]; 

      var map = Array.isArray(key) ? this._arrayTreeMap : this._objectTreeMap;

      for (var i = 0; i < properties.length; i++) {
        var property = properties[i];

        if (!map.has(property)) {
          map.set(property, new EquivalentKeyMap());
        }

        map = map.get(property);
        var propertyValue = key[property];

        if (!map.has(propertyValue)) {
          map.set(propertyValue, new EquivalentKeyMap());
        }

        map = map.get(propertyValue);
      } 
      
      
      


      var previousValuePair = map.get('_ekm_value');

      if (previousValuePair) {
        this._map.delete(previousValuePair[0]);
      }

      map.set('_ekm_value', valuePair);

      this._map.set(key, valuePair);

      return this;
    }
    

  }, {
    key: "get",
    value: function get(key) {
      
      if (key === null || _typeof(key) !== 'object') {
        return this._map.get(key);
      }

      var valuePair = getValuePair(this, key);

      if (valuePair) {
        return valuePair[1];
      }
    }
    

  }, {
    key: "has",
    value: function has(key) {
      if (key === null || _typeof(key) !== 'object') {
        return this._map.has(key);
      } 
      


      return getValuePair(this, key) !== undefined;
    }
    

  }, {
    key: "delete",
    value: function _delete(key) {
      if (!this.has(key)) {
        return false;
      } 
      


      this.set(key, undefined);
      return true;
    }
    

  }, {
    key: "forEach",
    value: function forEach(callback) {
      var _this = this;

      var thisArg = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : this;

      this._map.forEach(function (value, key) {
        
        if (key !== null && _typeof(key) === 'object') {
          value = value[1];
        }

        callback.call(thisArg, value, key, _this);
      });
    }
    

  }, {
    key: "clear",
    value: function clear() {
      this._map = new Map();
      this._arrayTreeMap = new Map();
      this._objectTreeMap = new Map();
    }
  }, {
    key: "size",
    get: function get() {
      return this._map.size;
    }
  }]);

  return EquivalentKeyMap;
}();

module.exports = EquivalentKeyMap;


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
 	
 		
 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
 	
 		
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

__webpack_require__.r(__webpack_exports__);


__webpack_require__.d(__webpack_exports__, {
  AsyncModeProvider: () => ( async_mode_provider_context),
  RegistryConsumer: () => ( RegistryConsumer),
  RegistryProvider: () => ( context),
  combineReducers: () => ( build_module_combineReducers),
  controls: () => ( controls),
  createReduxStore: () => ( createReduxStore),
  createRegistry: () => ( createRegistry),
  createRegistryControl: () => ( createRegistryControl),
  createRegistrySelector: () => ( createRegistrySelector),
  dispatch: () => ( dispatch_dispatch),
  plugins: () => ( plugins_namespaceObject),
  register: () => ( register),
  registerGenericStore: () => ( registerGenericStore),
  registerStore: () => ( registerStore),
  resolveSelect: () => ( build_module_resolveSelect),
  select: () => ( select_select),
  subscribe: () => ( subscribe),
  suspendSelect: () => ( suspendSelect),
  use: () => ( use),
  useDispatch: () => ( use_dispatch),
  useRegistry: () => ( useRegistry),
  useSelect: () => ( useSelect),
  useSuspenseSelect: () => ( useSuspenseSelect),
  withDispatch: () => ( with_dispatch),
  withRegistry: () => ( with_registry),
  withSelect: () => ( with_select)
});


var selectors_namespaceObject = {};
__webpack_require__.r(selectors_namespaceObject);
__webpack_require__.d(selectors_namespaceObject, {
  countSelectorsByStatus: () => (countSelectorsByStatus),
  getCachedResolvers: () => (getCachedResolvers),
  getIsResolving: () => (getIsResolving),
  getResolutionError: () => (getResolutionError),
  getResolutionState: () => (getResolutionState),
  hasFinishedResolution: () => (hasFinishedResolution),
  hasResolutionFailed: () => (hasResolutionFailed),
  hasResolvingSelectors: () => (hasResolvingSelectors),
  hasStartedResolution: () => (hasStartedResolution),
  isResolving: () => (isResolving)
});


var actions_namespaceObject = {};
__webpack_require__.r(actions_namespaceObject);
__webpack_require__.d(actions_namespaceObject, {
  failResolution: () => (failResolution),
  failResolutions: () => (failResolutions),
  finishResolution: () => (finishResolution),
  finishResolutions: () => (finishResolutions),
  invalidateResolution: () => (invalidateResolution),
  invalidateResolutionForStore: () => (invalidateResolutionForStore),
  invalidateResolutionForStoreSelector: () => (invalidateResolutionForStoreSelector),
  startResolution: () => (startResolution),
  startResolutions: () => (startResolutions)
});


var plugins_namespaceObject = {};
__webpack_require__.r(plugins_namespaceObject);
__webpack_require__.d(plugins_namespaceObject, {
  persistence: () => (persistence)
});

;
const external_wp_deprecated_namespaceObject = window["wp"]["deprecated"];
var external_wp_deprecated_default = __webpack_require__.n(external_wp_deprecated_namespaceObject);
;
function _typeof(o) {
  "@babel/helpers - typeof";

  return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) {
    return typeof o;
  } : function (o) {
    return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o;
  }, _typeof(o);
}
;

function _toPrimitive(input, hint) {
  if (_typeof(input) !== "object" || input === null) return input;
  var prim = input[Symbol.toPrimitive];
  if (prim !== undefined) {
    var res = prim.call(input, hint || "default");
    if (_typeof(res) !== "object") return res;
    throw new TypeError("@@toPrimitive must return a primitive value.");
  }
  return (hint === "string" ? String : Number)(input);
}
;


function _toPropertyKey(arg) {
  var key = _toPrimitive(arg, "string");
  return _typeof(key) === "symbol" ? key : String(key);
}
;

function _defineProperty(obj, key, value) {
  key = _toPropertyKey(key);
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }
  return obj;
}
;

function ownKeys(e, r) {
  var t = Object.keys(e);
  if (Object.getOwnPropertySymbols) {
    var o = Object.getOwnPropertySymbols(e);
    r && (o = o.filter(function (r) {
      return Object.getOwnPropertyDescriptor(e, r).enumerable;
    })), t.push.apply(t, o);
  }
  return t;
}
function _objectSpread2(e) {
  for (var r = 1; r < arguments.length; r++) {
    var t = null != arguments[r] ? arguments[r] : {};
    r % 2 ? ownKeys(Object(t), !0).forEach(function (r) {
      _defineProperty(e, r, t[r]);
    }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) {
      Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r));
    });
  }
  return e;
}
;



function formatProdErrorMessage(code) {
  return "Minified Redux error #" + code + "; visit https:
}


var $$observable = (function () {
  return typeof Symbol === 'function' && Symbol.observable || '@@observable';
})();


var randomString = function randomString() {
  return Math.random().toString(36).substring(7).split('').join('.');
};

var ActionTypes = {
  INIT: "@@redux/INIT" + randomString(),
  REPLACE: "@@redux/REPLACE" + randomString(),
  PROBE_UNKNOWN_ACTION: function PROBE_UNKNOWN_ACTION() {
    return "@@redux/PROBE_UNKNOWN_ACTION" + randomString();
  }
};


function isPlainObject(obj) {
  if (typeof obj !== 'object' || obj === null) return false;
  var proto = obj;

  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(obj) === proto;
}


function miniKindOf(val) {
  if (val === void 0) return 'undefined';
  if (val === null) return 'null';
  var type = typeof val;

  switch (type) {
    case 'boolean':
    case 'string':
    case 'number':
    case 'symbol':
    case 'function':
      {
        return type;
      }
  }

  if (Array.isArray(val)) return 'array';
  if (isDate(val)) return 'date';
  if (isError(val)) return 'error';
  var constructorName = ctorName(val);

  switch (constructorName) {
    case 'Symbol':
    case 'Promise':
    case 'WeakMap':
    case 'WeakSet':
    case 'Map':
    case 'Set':
      return constructorName;
  } 


  return type.slice(8, -1).toLowerCase().replace(/\s/g, '');
}

function ctorName(val) {
  return typeof val.constructor === 'function' ? val.constructor.name : null;
}

function isError(val) {
  return val instanceof Error || typeof val.message === 'string' && val.constructor && typeof val.constructor.stackTraceLimit === 'number';
}

function isDate(val) {
  if (val instanceof Date) return true;
  return typeof val.toDateString === 'function' && typeof val.getDate === 'function' && typeof val.setDate === 'function';
}

function kindOf(val) {
  var typeOfVal = typeof val;

  if (false) {}

  return typeOfVal;
}



function createStore(reducer, preloadedState, enhancer) {
  var _ref2;

  if (typeof preloadedState === 'function' && typeof enhancer === 'function' || typeof enhancer === 'function' && typeof arguments[3] === 'function') {
    throw new Error( true ? formatProdErrorMessage(0) : 0);
  }

  if (typeof preloadedState === 'function' && typeof enhancer === 'undefined') {
    enhancer = preloadedState;
    preloadedState = undefined;
  }

  if (typeof enhancer !== 'undefined') {
    if (typeof enhancer !== 'function') {
      throw new Error( true ? formatProdErrorMessage(1) : 0);
    }

    return enhancer(createStore)(reducer, preloadedState);
  }

  if (typeof reducer !== 'function') {
    throw new Error( true ? formatProdErrorMessage(2) : 0);
  }

  var currentReducer = reducer;
  var currentState = preloadedState;
  var currentListeners = [];
  var nextListeners = currentListeners;
  var isDispatching = false;
  

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }
  


  function getState() {
    if (isDispatching) {
      throw new Error( true ? formatProdErrorMessage(3) : 0);
    }

    return currentState;
  }
  


  function subscribe(listener) {
    if (typeof listener !== 'function') {
      throw new Error( true ? formatProdErrorMessage(4) : 0);
    }

    if (isDispatching) {
      throw new Error( true ? formatProdErrorMessage(5) : 0);
    }

    var isSubscribed = true;
    ensureCanMutateNextListeners();
    nextListeners.push(listener);
    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      if (isDispatching) {
        throw new Error( true ? formatProdErrorMessage(6) : 0);
      }

      isSubscribed = false;
      ensureCanMutateNextListeners();
      var index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
      currentListeners = null;
    };
  }
  


  function dispatch(action) {
    if (!isPlainObject(action)) {
      throw new Error( true ? formatProdErrorMessage(7) : 0);
    }

    if (typeof action.type === 'undefined') {
      throw new Error( true ? formatProdErrorMessage(8) : 0);
    }

    if (isDispatching) {
      throw new Error( true ? formatProdErrorMessage(9) : 0);
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    var listeners = currentListeners = nextListeners;

    for (var i = 0; i < listeners.length; i++) {
      var listener = listeners[i];
      listener();
    }

    return action;
  }
  


  function replaceReducer(nextReducer) {
    if (typeof nextReducer !== 'function') {
      throw new Error( true ? formatProdErrorMessage(10) : 0);
    }

    currentReducer = nextReducer; 
    
    
    

    dispatch({
      type: ActionTypes.REPLACE
    });
  }
  


  function observable() {
    var _ref;

    var outerSubscribe = subscribe;
    return _ref = {
      
      subscribe: function subscribe(observer) {
        if (typeof observer !== 'object' || observer === null) {
          throw new Error( true ? formatProdErrorMessage(11) : 0);
        }

        function observeState() {
          if (observer.next) {
            observer.next(getState());
          }
        }

        observeState();
        var unsubscribe = outerSubscribe(observeState);
        return {
          unsubscribe: unsubscribe
        };
      }
    }, _ref[$$observable] = function () {
      return this;
    }, _ref;
  } 
  
  


  dispatch({
    type: ActionTypes.INIT
  });
  return _ref2 = {
    dispatch: dispatch,
    subscribe: subscribe,
    getState: getState,
    replaceReducer: replaceReducer
  }, _ref2[$$observable] = observable, _ref2;
}


var legacy_createStore = ( null && (createStore));


function warning(message) {
  
  if (typeof console !== 'undefined' && typeof console.error === 'function') {
    console.error(message);
  }
  


  try {
    
    
    
    throw new Error(message);
  } catch (e) {} 

}

function getUnexpectedStateShapeWarningMessage(inputState, reducers, action, unexpectedKeyCache) {
  var reducerKeys = Object.keys(reducers);
  var argumentName = action && action.type === ActionTypes.INIT ? 'preloadedState argument passed to createStore' : 'previous state received by the reducer';

  if (reducerKeys.length === 0) {
    return 'Store does not have a valid reducer. Make sure the argument passed ' + 'to combineReducers is an object whose values are reducers.';
  }

  if (!isPlainObject(inputState)) {
    return "The " + argumentName + " has unexpected type of \"" + kindOf(inputState) + "\". Expected argument to be an object with the following " + ("keys: \"" + reducerKeys.join('", "') + "\"");
  }

  var unexpectedKeys = Object.keys(inputState).filter(function (key) {
    return !reducers.hasOwnProperty(key) && !unexpectedKeyCache[key];
  });
  unexpectedKeys.forEach(function (key) {
    unexpectedKeyCache[key] = true;
  });
  if (action && action.type === ActionTypes.REPLACE) return;

  if (unexpectedKeys.length > 0) {
    return "Unexpected " + (unexpectedKeys.length > 1 ? 'keys' : 'key') + " " + ("\"" + unexpectedKeys.join('", "') + "\" found in " + argumentName + ". ") + "Expected to find one of the known reducer keys instead: " + ("\"" + reducerKeys.join('", "') + "\". Unexpected keys will be ignored.");
  }
}

function assertReducerShape(reducers) {
  Object.keys(reducers).forEach(function (key) {
    var reducer = reducers[key];
    var initialState = reducer(undefined, {
      type: ActionTypes.INIT
    });

    if (typeof initialState === 'undefined') {
      throw new Error( true ? formatProdErrorMessage(12) : 0);
    }

    if (typeof reducer(undefined, {
      type: ActionTypes.PROBE_UNKNOWN_ACTION()
    }) === 'undefined') {
      throw new Error( true ? formatProdErrorMessage(13) : 0);
    }
  });
}



function combineReducers(reducers) {
  var reducerKeys = Object.keys(reducers);
  var finalReducers = {};

  for (var i = 0; i < reducerKeys.length; i++) {
    var key = reducerKeys[i];

    if (false) {}

    if (typeof reducers[key] === 'function') {
      finalReducers[key] = reducers[key];
    }
  }

  var finalReducerKeys = Object.keys(finalReducers); 
  

  var unexpectedKeyCache;

  if (false) {}

  var shapeAssertionError;

  try {
    assertReducerShape(finalReducers);
  } catch (e) {
    shapeAssertionError = e;
  }

  return function combination(state, action) {
    if (state === void 0) {
      state = {};
    }

    if (shapeAssertionError) {
      throw shapeAssertionError;
    }

    if (false) { var warningMessage; }

    var hasChanged = false;
    var nextState = {};

    for (var _i = 0; _i < finalReducerKeys.length; _i++) {
      var _key = finalReducerKeys[_i];
      var reducer = finalReducers[_key];
      var previousStateForKey = state[_key];
      var nextStateForKey = reducer(previousStateForKey, action);

      if (typeof nextStateForKey === 'undefined') {
        var actionType = action && action.type;
        throw new Error( true ? formatProdErrorMessage(14) : 0);
      }

      nextState[_key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }

    hasChanged = hasChanged || finalReducerKeys.length !== Object.keys(state).length;
    return hasChanged ? nextState : state;
  };
}

function bindActionCreator(actionCreator, dispatch) {
  return function () {
    return dispatch(actionCreator.apply(this, arguments));
  };
}



function bindActionCreators(actionCreators, dispatch) {
  if (typeof actionCreators === 'function') {
    return bindActionCreator(actionCreators, dispatch);
  }

  if (typeof actionCreators !== 'object' || actionCreators === null) {
    throw new Error( true ? formatProdErrorMessage(16) : 0);
  }

  var boundActionCreators = {};

  for (var key in actionCreators) {
    var actionCreator = actionCreators[key];

    if (typeof actionCreator === 'function') {
      boundActionCreators[key] = bindActionCreator(actionCreator, dispatch);
    }
  }

  return boundActionCreators;
}


function compose() {
  for (var _len = arguments.length, funcs = new Array(_len), _key = 0; _key < _len; _key++) {
    funcs[_key] = arguments[_key];
  }

  if (funcs.length === 0) {
    return function (arg) {
      return arg;
    };
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce(function (a, b) {
    return function () {
      return a(b.apply(void 0, arguments));
    };
  });
}



function applyMiddleware() {
  for (var _len = arguments.length, middlewares = new Array(_len), _key = 0; _key < _len; _key++) {
    middlewares[_key] = arguments[_key];
  }

  return function (createStore) {
    return function () {
      var store = createStore.apply(void 0, arguments);

      var _dispatch = function dispatch() {
        throw new Error( true ? formatProdErrorMessage(15) : 0);
      };

      var middlewareAPI = {
        getState: store.getState,
        dispatch: function dispatch() {
          return _dispatch.apply(void 0, arguments);
        }
      };
      var chain = middlewares.map(function (middleware) {
        return middleware(middlewareAPI);
      });
      _dispatch = compose.apply(void 0, chain)(store.dispatch);
      return _objectSpread2(_objectSpread2({}, store), {}, {
        dispatch: _dispatch
      });
    };
  };
}




var equivalent_key_map = __webpack_require__(3249);
var equivalent_key_map_default = __webpack_require__.n(equivalent_key_map);
;
const external_wp_reduxRoutine_namespaceObject = window["wp"]["reduxRoutine"];
var external_wp_reduxRoutine_default = __webpack_require__.n(external_wp_reduxRoutine_namespaceObject);
;
const external_wp_compose_namespaceObject = window["wp"]["compose"];
;
function combine_reducers_combineReducers(reducers) {
  const keys = Object.keys(reducers);
  return function combinedReducer(state = {}, action) {
    const nextState = {};
    let hasChanged = false;
    for (const key of keys) {
      const reducer = reducers[key];
      const prevStateForKey = state[key];
      const nextStateForKey = reducer(prevStateForKey, action);
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== prevStateForKey;
    }
    return hasChanged ? nextState : state;
  };
}

;

function createRegistrySelector(registrySelector) {
  const selectorsByRegistry = new WeakMap();
  
  
  
  const wrappedSelector = (...args) => {
    let selector = selectorsByRegistry.get(wrappedSelector.registry);
    
    
    
    
    if (!selector) {
      selector = registrySelector(wrappedSelector.registry.select);
      selectorsByRegistry.set(wrappedSelector.registry, selector);
    }
    return selector(...args);
  };

  
  wrappedSelector.isRegistrySelector = true;
  return wrappedSelector;
}


function createRegistryControl(registryControl) {
  registryControl.isRegistryControl = true;
  return registryControl;
}

;





const SELECT = '@@data/SELECT';
const RESOLVE_SELECT = '@@data/RESOLVE_SELECT';
const DISPATCH = '@@data/DISPATCH';
function isObject(object) {
  return object !== null && typeof object === 'object';
}


function controls_select(storeNameOrDescriptor, selectorName, ...args) {
  return {
    type: SELECT,
    storeKey: isObject(storeNameOrDescriptor) ? storeNameOrDescriptor.name : storeNameOrDescriptor,
    selectorName,
    args
  };
}


function resolveSelect(storeNameOrDescriptor, selectorName, ...args) {
  return {
    type: RESOLVE_SELECT,
    storeKey: isObject(storeNameOrDescriptor) ? storeNameOrDescriptor.name : storeNameOrDescriptor,
    selectorName,
    args
  };
}


function dispatch(storeNameOrDescriptor, actionName, ...args) {
  return {
    type: DISPATCH,
    storeKey: isObject(storeNameOrDescriptor) ? storeNameOrDescriptor.name : storeNameOrDescriptor,
    actionName,
    args
  };
}
const controls = {
  select: controls_select,
  resolveSelect,
  dispatch
};
const builtinControls = {
  [SELECT]: createRegistryControl(registry => ({
    storeKey,
    selectorName,
    args
  }) => registry.select(storeKey)[selectorName](...args)),
  [RESOLVE_SELECT]: createRegistryControl(registry => ({
    storeKey,
    selectorName,
    args
  }) => {
    const method = registry.select(storeKey)[selectorName].hasResolver ? 'resolveSelect' : 'select';
    return registry[method](storeKey)[selectorName](...args);
  }),
  [DISPATCH]: createRegistryControl(registry => ({
    storeKey,
    actionName,
    args
  }) => registry.dispatch(storeKey)[actionName](...args))
};

;
const external_wp_privateApis_namespaceObject = window["wp"]["privateApis"];
;


const {
  lock,
  unlock
} = (0,external_wp_privateApis_namespaceObject.__dangerousOptInToUnstableAPIsOnlyForCoreModules)('I know using unstable features means my theme or plugin will inevitably break in the next version of WordPress.', '@wordpress/data');

;
function isPromise(obj) {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
}

;




const promiseMiddleware = () => next => action => {
  if (isPromise(action)) {
    return action.then(resolvedAction => {
      if (resolvedAction) {
        return next(resolvedAction);
      }
    });
  }
  return next(action);
};
 const promise_middleware = (promiseMiddleware);

;



const createResolversCacheMiddleware = (registry, storeName) => () => next => action => {
  const resolvers = registry.select(storeName).getCachedResolvers();
  const resolverEntries = Object.entries(resolvers);
  resolverEntries.forEach(([selectorName, resolversByArgs]) => {
    const resolver = registry.stores[storeName]?.resolvers?.[selectorName];
    if (!resolver || !resolver.shouldInvalidate) {
      return;
    }
    resolversByArgs.forEach((value, args) => {
      
      
      if (value === undefined) {
        return;
      }

      
      
      
      if (value.status !== 'finished' && value.status !== 'error') {
        return;
      }
      if (!resolver.shouldInvalidate(action, ...args)) {
        return;
      }

      
      registry.dispatch(storeName).invalidateResolution(selectorName, args);
    });
  });
  return next(action);
};
 const resolvers_cache_middleware = (createResolversCacheMiddleware);

;
function createThunkMiddleware(args) {
  return () => next => action => {
    if (typeof action === 'function') {
      return action(args);
    }
    return next(action);
  };
}

;



const onSubKey = actionProperty => reducer => (state = {}, action) => {
  
  
  const key = action[actionProperty];
  if (key === undefined) {
    return state;
  }

  
  
  const nextKeyState = reducer(state[key], action);
  if (nextKeyState === state[key]) {
    return state;
  }
  return {
    ...state,
    [key]: nextKeyState
  };
};


function selectorArgsToStateKey(args) {
  if (args === undefined || args === null) {
    return [];
  }
  const len = args.length;
  let idx = len;
  while (idx > 0 && args[idx - 1] === undefined) {
    idx--;
  }
  return idx === len ? args : args.slice(0, idx);
}

;





const subKeysIsResolved = onSubKey('selectorName')((state = new (equivalent_key_map_default())(), action) => {
  switch (action.type) {
    case 'START_RESOLUTION':
      {
        const nextState = new (equivalent_key_map_default())(state);
        nextState.set(selectorArgsToStateKey(action.args), {
          status: 'resolving'
        });
        return nextState;
      }
    case 'FINISH_RESOLUTION':
      {
        const nextState = new (equivalent_key_map_default())(state);
        nextState.set(selectorArgsToStateKey(action.args), {
          status: 'finished'
        });
        return nextState;
      }
    case 'FAIL_RESOLUTION':
      {
        const nextState = new (equivalent_key_map_default())(state);
        nextState.set(selectorArgsToStateKey(action.args), {
          status: 'error',
          error: action.error
        });
        return nextState;
      }
    case 'START_RESOLUTIONS':
      {
        const nextState = new (equivalent_key_map_default())(state);
        for (const resolutionArgs of action.args) {
          nextState.set(selectorArgsToStateKey(resolutionArgs), {
            status: 'resolving'
          });
        }
        return nextState;
      }
    case 'FINISH_RESOLUTIONS':
      {
        const nextState = new (equivalent_key_map_default())(state);
        for (const resolutionArgs of action.args) {
          nextState.set(selectorArgsToStateKey(resolutionArgs), {
            status: 'finished'
          });
        }
        return nextState;
      }
    case 'FAIL_RESOLUTIONS':
      {
        const nextState = new (equivalent_key_map_default())(state);
        action.args.forEach((resolutionArgs, idx) => {
          const resolutionState = {
            status: 'error',
            error: undefined
          };
          const error = action.errors[idx];
          if (error) {
            resolutionState.error = error;
          }
          nextState.set(selectorArgsToStateKey(resolutionArgs), resolutionState);
        });
        return nextState;
      }
    case 'INVALIDATE_RESOLUTION':
      {
        const nextState = new (equivalent_key_map_default())(state);
        nextState.delete(selectorArgsToStateKey(action.args));
        return nextState;
      }
  }
  return state;
});


const isResolved = (state = {}, action) => {
  switch (action.type) {
    case 'INVALIDATE_RESOLUTION_FOR_STORE':
      return {};
    case 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR':
      {
        if (action.selectorName in state) {
          const {
            [action.selectorName]: removedSelector,
            ...restState
          } = state;
          return restState;
        }
        return state;
      }
    case 'START_RESOLUTION':
    case 'FINISH_RESOLUTION':
    case 'FAIL_RESOLUTION':
    case 'START_RESOLUTIONS':
    case 'FINISH_RESOLUTIONS':
    case 'FAIL_RESOLUTIONS':
    case 'INVALIDATE_RESOLUTION':
      return subKeysIsResolved(state, action);
  }
  return state;
};
 const metadata_reducer = (isResolved);

;













var LEAF_KEY = {};


function arrayOf(value) {
	return [value];
}


function isObjectLike(value) {
	return !!value && 'object' === typeof value;
}


function createCache() {
	
	var cache = {
		clear: function () {
			cache.head = null;
		},
	};

	return cache;
}


function isShallowEqual(a, b, fromIndex) {
	var i;

	if (a.length !== b.length) {
		return false;
	}

	for (i = fromIndex; i < a.length; i++) {
		if (a[i] !== b[i]) {
			return false;
		}
	}

	return true;
}


 function rememo(selector, getDependants) {
	
	var rootCache;

	
	var normalizedGetDependants = getDependants ? getDependants : arrayOf;

	
	function getCache(dependants) {
		var caches = rootCache,
			isUniqueByDependants = true,
			i,
			dependant,
			map,
			cache;

		for (i = 0; i < dependants.length; i++) {
			dependant = dependants[i];

			
			if (!isObjectLike(dependant)) {
				isUniqueByDependants = false;
				break;
			}

			
			if (caches.has(dependant)) {
				
				caches = caches.get(dependant);
			} else {
				
				map = new WeakMap();
				caches.set(dependant, map);
				caches = map;
			}
		}

		
		
		if (!caches.has(LEAF_KEY)) {
			cache = createCache();
			cache.isUniqueByDependants = isUniqueByDependants;
			caches.set(LEAF_KEY, cache);
		}

		return caches.get(LEAF_KEY);
	}

	
	function clear() {
		rootCache = new WeakMap();
	}

	
	
	
	function callSelector() {
		var len = arguments.length,
			cache,
			node,
			i,
			args,
			dependants;

		
		args = new Array(len);
		for (i = 0; i < len; i++) {
			args[i] = arguments[i];
		}

		dependants = normalizedGetDependants.apply(null, args);
		cache = getCache(dependants);

		
		
		
		if (!cache.isUniqueByDependants) {
			if (
				cache.lastDependants &&
				!isShallowEqual(dependants, cache.lastDependants, 0)
			) {
				cache.clear();
			}

			cache.lastDependants = dependants;
		}

		node = cache.head;
		while (node) {
			
			if (!isShallowEqual(node.args, args, 1)) {
				node = node.next;
				continue;
			}

			

			
			if (node !== cache.head) {
				
				 (node.prev).next = node.next;
				if (node.next) {
					node.next.prev = node.prev;
				}

				node.next = cache.head;
				node.prev = null;
				 (cache.head).prev = node;
				cache.head = node;
			}

			
			return node.val;
		}

		

		node =  ({
			
			val: selector.apply(null, args),
		});

		
		args[0] = null;
		node.args = args;

		
		

		
		if (cache.head) {
			cache.head.prev = node;
			node.next = cache.head;
		}

		cache.head = node;

		return node.val;
	}

	callSelector.getDependants = normalizedGetDependants;
	callSelector.clear = clear;
	clear();

	return  (callSelector);
}

;











function getResolutionState(state, selectorName, args) {
  const map = state[selectorName];
  if (!map) {
    return;
  }
  return map.get(selectorArgsToStateKey(args));
}


function getIsResolving(state, selectorName, args) {
  const resolutionState = getResolutionState(state, selectorName, args);
  return resolutionState && resolutionState.status === 'resolving';
}


function hasStartedResolution(state, selectorName, args) {
  return getResolutionState(state, selectorName, args) !== undefined;
}


function hasFinishedResolution(state, selectorName, args) {
  const status = getResolutionState(state, selectorName, args)?.status;
  return status === 'finished' || status === 'error';
}


function hasResolutionFailed(state, selectorName, args) {
  return getResolutionState(state, selectorName, args)?.status === 'error';
}


function getResolutionError(state, selectorName, args) {
  const resolutionState = getResolutionState(state, selectorName, args);
  return resolutionState?.status === 'error' ? resolutionState.error : null;
}


function isResolving(state, selectorName, args) {
  return getResolutionState(state, selectorName, args)?.status === 'resolving';
}


function getCachedResolvers(state) {
  return state;
}


function hasResolvingSelectors(state) {
  return Object.values(state).some(selectorState =>
  
  Array.from(selectorState._map.values()).some(resolution => resolution[1]?.status === 'resolving'));
}


const countSelectorsByStatus = rememo(state => {
  const selectorsByStatus = {};
  Object.values(state).forEach(selectorState =>
  
  Array.from(selectorState._map.values()).forEach(resolution => {
    var _resolution$1$status;
    const currentStatus = (_resolution$1$status = resolution[1]?.status) !== null && _resolution$1$status !== void 0 ? _resolution$1$status : 'error';
    if (!selectorsByStatus[currentStatus]) {
      selectorsByStatus[currentStatus] = 0;
    }
    selectorsByStatus[currentStatus]++;
  }));
  return selectorsByStatus;
}, state => [state]);

;

function startResolution(selectorName, args) {
  return {
    type: 'START_RESOLUTION',
    selectorName,
    args
  };
}


function finishResolution(selectorName, args) {
  return {
    type: 'FINISH_RESOLUTION',
    selectorName,
    args
  };
}


function failResolution(selectorName, args, error) {
  return {
    type: 'FAIL_RESOLUTION',
    selectorName,
    args,
    error
  };
}


function startResolutions(selectorName, args) {
  return {
    type: 'START_RESOLUTIONS',
    selectorName,
    args
  };
}


function finishResolutions(selectorName, args) {
  return {
    type: 'FINISH_RESOLUTIONS',
    selectorName,
    args
  };
}


function failResolutions(selectorName, args, errors) {
  return {
    type: 'FAIL_RESOLUTIONS',
    selectorName,
    args,
    errors
  };
}


function invalidateResolution(selectorName, args) {
  return {
    type: 'INVALIDATE_RESOLUTION',
    selectorName,
    args
  };
}


function invalidateResolutionForStore() {
  return {
    type: 'INVALIDATE_RESOLUTION_FOR_STORE'
  };
}


function invalidateResolutionForStoreSelector(selectorName) {
  return {
    type: 'INVALIDATE_RESOLUTION_FOR_STORE_SELECTOR',
    selectorName
  };
}

;

























const trimUndefinedValues = array => {
  const result = [...array];
  for (let i = result.length - 1; i >= 0; i--) {
    if (result[i] === undefined) {
      result.splice(i, 1);
    }
  }
  return result;
};


const mapValues = (obj, callback) => Object.fromEntries(Object.entries(obj !== null && obj !== void 0 ? obj : {}).map(([key, value]) => [key, callback(value, key)]));


const mapToObject = (key, state) => {
  if (state instanceof Map) {
    return Object.fromEntries(state);
  }
  return state;
};


function createResolversCache() {
  const cache = {};
  return {
    isRunning(selectorName, args) {
      return cache[selectorName] && cache[selectorName].get(trimUndefinedValues(args));
    },
    clear(selectorName, args) {
      if (cache[selectorName]) {
        cache[selectorName].delete(trimUndefinedValues(args));
      }
    },
    markAsRunning(selectorName, args) {
      if (!cache[selectorName]) {
        cache[selectorName] = new (equivalent_key_map_default())();
      }
      cache[selectorName].set(trimUndefinedValues(args), true);
    }
  };
}
function createBindingCache(bind) {
  const cache = new WeakMap();
  return {
    get(item, itemName) {
      let boundItem = cache.get(item);
      if (!boundItem) {
        boundItem = bind(item, itemName);
        cache.set(item, boundItem);
      }
      return boundItem;
    }
  };
}


function createReduxStore(key, options) {
  const privateActions = {};
  const privateSelectors = {};
  const privateRegistrationFunctions = {
    privateActions,
    registerPrivateActions: actions => {
      Object.assign(privateActions, actions);
    },
    privateSelectors,
    registerPrivateSelectors: selectors => {
      Object.assign(privateSelectors, selectors);
    }
  };
  const storeDescriptor = {
    name: key,
    instantiate: registry => {
      
      const listeners = new Set();
      const reducer = options.reducer;
      const thunkArgs = {
        registry,
        get dispatch() {
          return thunkActions;
        },
        get select() {
          return thunkSelectors;
        },
        get resolveSelect() {
          return getResolveSelectors();
        }
      };
      const store = instantiateReduxStore(key, options, registry, thunkArgs);
      
      
      lock(store, privateRegistrationFunctions);
      const resolversCache = createResolversCache();
      function bindAction(action) {
        return (...args) => Promise.resolve(store.dispatch(action(...args)));
      }
      const actions = {
        ...mapValues(actions_namespaceObject, bindAction),
        ...mapValues(options.actions, bindAction)
      };
      const boundPrivateActions = createBindingCache(bindAction);
      const allActions = new Proxy(() => {}, {
        get: (target, prop) => {
          const privateAction = privateActions[prop];
          return privateAction ? boundPrivateActions.get(privateAction, prop) : actions[prop];
        }
      });
      const thunkActions = new Proxy(allActions, {
        apply: (target, thisArg, [action]) => store.dispatch(action)
      });
      lock(actions, allActions);
      const resolvers = options.resolvers ? mapResolvers(options.resolvers) : {};
      function bindSelector(selector, selectorName) {
        if (selector.isRegistrySelector) {
          selector.registry = registry;
        }
        const boundSelector = (...args) => {
          args = normalize(selector, args);
          const state = store.__unstableOriginalGetState();
          
          
          if (selector.isRegistrySelector) {
            selector.registry = registry;
          }
          return selector(state.root, ...args);
        };

        
        
        
        boundSelector.__unstableNormalizeArgs = selector.__unstableNormalizeArgs;
        const resolver = resolvers[selectorName];
        if (!resolver) {
          boundSelector.hasResolver = false;
          return boundSelector;
        }
        return mapSelectorWithResolver(boundSelector, selectorName, resolver, store, resolversCache);
      }
      function bindMetadataSelector(metaDataSelector) {
        const boundSelector = (...args) => {
          const state = store.__unstableOriginalGetState();
          const originalSelectorName = args && args[0];
          const originalSelectorArgs = args && args[1];
          const targetSelector = options?.selectors?.[originalSelectorName];

          
          if (originalSelectorName && targetSelector) {
            args[1] = normalize(targetSelector, originalSelectorArgs);
          }
          return metaDataSelector(state.metadata, ...args);
        };
        boundSelector.hasResolver = false;
        return boundSelector;
      }
      const selectors = {
        ...mapValues(selectors_namespaceObject, bindMetadataSelector),
        ...mapValues(options.selectors, bindSelector)
      };
      const boundPrivateSelectors = createBindingCache(bindSelector);

      
      
      for (const [selectorName, selector] of Object.entries(privateSelectors)) {
        boundPrivateSelectors.get(selector, selectorName);
      }
      const allSelectors = new Proxy(() => {}, {
        get: (target, prop) => {
          const privateSelector = privateSelectors[prop];
          return privateSelector ? boundPrivateSelectors.get(privateSelector, prop) : selectors[prop];
        }
      });
      const thunkSelectors = new Proxy(allSelectors, {
        apply: (target, thisArg, [selector]) => selector(store.__unstableOriginalGetState())
      });
      lock(selectors, allSelectors);
      const resolveSelectors = mapResolveSelectors(selectors, store);
      const suspendSelectors = mapSuspendSelectors(selectors, store);
      const getSelectors = () => selectors;
      const getActions = () => actions;
      const getResolveSelectors = () => resolveSelectors;
      const getSuspendSelectors = () => suspendSelectors;

      
      
      
      store.__unstableOriginalGetState = store.getState;
      store.getState = () => store.__unstableOriginalGetState().root;

      
      
      const subscribe = store && (listener => {
        listeners.add(listener);
        return () => listeners.delete(listener);
      });
      let lastState = store.__unstableOriginalGetState();
      store.subscribe(() => {
        const state = store.__unstableOriginalGetState();
        const hasChanged = state !== lastState;
        lastState = state;
        if (hasChanged) {
          for (const listener of listeners) {
            listener();
          }
        }
      });

      
      
      return {
        reducer,
        store,
        actions,
        selectors,
        resolvers,
        getSelectors,
        getResolveSelectors,
        getSuspendSelectors,
        getActions,
        subscribe
      };
    }
  };

  
  
  
  lock(storeDescriptor, privateRegistrationFunctions);
  return storeDescriptor;
}


function instantiateReduxStore(key, options, registry, thunkArgs) {
  const controls = {
    ...options.controls,
    ...builtinControls
  };
  const normalizedControls = mapValues(controls, control => control.isRegistryControl ? control(registry) : control);
  const middlewares = [resolvers_cache_middleware(registry, key), promise_middleware, external_wp_reduxRoutine_default()(normalizedControls), createThunkMiddleware(thunkArgs)];
  const enhancers = [applyMiddleware(...middlewares)];
  if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
    enhancers.push(window.__REDUX_DEVTOOLS_EXTENSION__({
      name: key,
      instanceId: key,
      serialize: {
        replacer: mapToObject
      }
    }));
  }
  const {
    reducer,
    initialState
  } = options;
  const enhancedReducer = combine_reducers_combineReducers({
    metadata: metadata_reducer,
    root: reducer
  });
  return createStore(enhancedReducer, {
    root: initialState
  }, (0,external_wp_compose_namespaceObject.compose)(enhancers));
}


function mapResolveSelectors(selectors, store) {
  const {
    getIsResolving,
    hasStartedResolution,
    hasFinishedResolution,
    hasResolutionFailed,
    isResolving,
    getCachedResolvers,
    getResolutionState,
    getResolutionError,
    hasResolvingSelectors,
    countSelectorsByStatus,
    ...storeSelectors
  } = selectors;
  return mapValues(storeSelectors, (selector, selectorName) => {
    
    
    if (!selector.hasResolver) {
      return async (...args) => selector.apply(null, args);
    }
    return (...args) => {
      return new Promise((resolve, reject) => {
        const hasFinished = () => selectors.hasFinishedResolution(selectorName, args);
        const finalize = result => {
          const hasFailed = selectors.hasResolutionFailed(selectorName, args);
          if (hasFailed) {
            const error = selectors.getResolutionError(selectorName, args);
            reject(error);
          } else {
            resolve(result);
          }
        };
        const getResult = () => selector.apply(null, args);
        
        const result = getResult();
        if (hasFinished()) {
          return finalize(result);
        }
        const unsubscribe = store.subscribe(() => {
          if (hasFinished()) {
            unsubscribe();
            finalize(getResult());
          }
        });
      });
    };
  });
}


function mapSuspendSelectors(selectors, store) {
  return mapValues(selectors, (selector, selectorName) => {
    
    if (!selector.hasResolver) {
      return selector;
    }
    return (...args) => {
      const result = selector.apply(null, args);
      if (selectors.hasFinishedResolution(selectorName, args)) {
        if (selectors.hasResolutionFailed(selectorName, args)) {
          throw selectors.getResolutionError(selectorName, args);
        }
        return result;
      }
      throw new Promise(resolve => {
        const unsubscribe = store.subscribe(() => {
          if (selectors.hasFinishedResolution(selectorName, args)) {
            resolve();
            unsubscribe();
          }
        });
      });
    };
  });
}


function mapResolvers(resolvers) {
  return mapValues(resolvers, resolver => {
    if (resolver.fulfill) {
      return resolver;
    }
    return {
      ...resolver,
      
      fulfill: resolver 
    };
  });
}


function mapSelectorWithResolver(selector, selectorName, resolver, store, resolversCache) {
  function fulfillSelector(args) {
    const state = store.getState();
    if (resolversCache.isRunning(selectorName, args) || typeof resolver.isFulfilled === 'function' && resolver.isFulfilled(state, ...args)) {
      return;
    }
    const {
      metadata
    } = store.__unstableOriginalGetState();
    if (hasStartedResolution(metadata, selectorName, args)) {
      return;
    }
    resolversCache.markAsRunning(selectorName, args);
    setTimeout(async () => {
      resolversCache.clear(selectorName, args);
      store.dispatch(startResolution(selectorName, args));
      try {
        const action = resolver.fulfill(...args);
        if (action) {
          await store.dispatch(action);
        }
        store.dispatch(finishResolution(selectorName, args));
      } catch (error) {
        store.dispatch(failResolution(selectorName, args, error));
      }
    }, 0);
  }
  const selectorResolver = (...args) => {
    args = normalize(selector, args);
    fulfillSelector(args);
    return selector(...args);
  };
  selectorResolver.hasResolver = true;
  return selectorResolver;
}


function normalize(selector, args) {
  if (selector.__unstableNormalizeArgs && typeof selector.__unstableNormalizeArgs === 'function' && args?.length) {
    return selector.__unstableNormalizeArgs(args);
  }
  return args;
}

;
const coreDataStore = {
  name: 'core/data',
  instantiate(registry) {
    const getCoreDataSelector = selectorName => (key, ...args) => {
      return registry.select(key)[selectorName](...args);
    };
    const getCoreDataAction = actionName => (key, ...args) => {
      return registry.dispatch(key)[actionName](...args);
    };
    return {
      getSelectors() {
        return Object.fromEntries(['getIsResolving', 'hasStartedResolution', 'hasFinishedResolution', 'isResolving', 'getCachedResolvers'].map(selectorName => [selectorName, getCoreDataSelector(selectorName)]));
      },
      getActions() {
        return Object.fromEntries(['startResolution', 'finishResolution', 'invalidateResolution', 'invalidateResolutionForStore', 'invalidateResolutionForStoreSelector'].map(actionName => [actionName, getCoreDataAction(actionName)]));
      },
      subscribe() {
        
        
        
        
        return () => () => {};
      }
    };
  }
};
 const store = (coreDataStore);

;

function createEmitter() {
  let isPaused = false;
  let isPending = false;
  const listeners = new Set();
  const notifyListeners = () =>
  
  
  
  Array.from(listeners).forEach(listener => listener());
  return {
    get isPaused() {
      return isPaused;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    pause() {
      isPaused = true;
    },
    resume() {
      isPaused = false;
      if (isPending) {
        isPending = false;
        notifyListeners();
      }
    },
    emit() {
      if (isPaused) {
        isPending = true;
        return;
      }
      notifyListeners();
    }
  };
}

;















function getStoreName(storeNameOrDescriptor) {
  return typeof storeNameOrDescriptor === 'string' ? storeNameOrDescriptor : storeNameOrDescriptor.name;
}

function createRegistry(storeConfigs = {}, parent = null) {
  const stores = {};
  const emitter = createEmitter();
  let listeningStores = null;

  
  function globalListener() {
    emitter.emit();
  }

  
  const subscribe = (listener, storeNameOrDescriptor) => {
    
    if (!storeNameOrDescriptor) {
      return emitter.subscribe(listener);
    }

    
    const storeName = getStoreName(storeNameOrDescriptor);
    const store = stores[storeName];
    if (store) {
      return store.subscribe(listener);
    }

    
    
    
    
    if (!parent) {
      return emitter.subscribe(listener);
    }
    return parent.subscribe(listener, storeNameOrDescriptor);
  };

  
  function select(storeNameOrDescriptor) {
    const storeName = getStoreName(storeNameOrDescriptor);
    listeningStores?.add(storeName);
    const store = stores[storeName];
    if (store) {
      return store.getSelectors();
    }
    return parent?.select(storeName);
  }
  function __unstableMarkListeningStores(callback, ref) {
    listeningStores = new Set();
    try {
      return callback.call(this);
    } finally {
      ref.current = Array.from(listeningStores);
      listeningStores = null;
    }
  }

  
  function resolveSelect(storeNameOrDescriptor) {
    const storeName = getStoreName(storeNameOrDescriptor);
    listeningStores?.add(storeName);
    const store = stores[storeName];
    if (store) {
      return store.getResolveSelectors();
    }
    return parent && parent.resolveSelect(storeName);
  }

  
  function suspendSelect(storeNameOrDescriptor) {
    const storeName = getStoreName(storeNameOrDescriptor);
    listeningStores?.add(storeName);
    const store = stores[storeName];
    if (store) {
      return store.getSuspendSelectors();
    }
    return parent && parent.suspendSelect(storeName);
  }

  
  function dispatch(storeNameOrDescriptor) {
    const storeName = getStoreName(storeNameOrDescriptor);
    const store = stores[storeName];
    if (store) {
      return store.getActions();
    }
    return parent && parent.dispatch(storeName);
  }

  
  
  
  function withPlugins(attributes) {
    return Object.fromEntries(Object.entries(attributes).map(([key, attribute]) => {
      if (typeof attribute !== 'function') {
        return [key, attribute];
      }
      return [key, function () {
        return registry[key].apply(null, arguments);
      }];
    }));
  }

  
  function registerStoreInstance(name, createStore) {
    if (stores[name]) {
      
      console.error('Store "' + name + '" is already registered.');
      return stores[name];
    }
    const store = createStore();
    if (typeof store.getSelectors !== 'function') {
      throw new TypeError('store.getSelectors must be a function');
    }
    if (typeof store.getActions !== 'function') {
      throw new TypeError('store.getActions must be a function');
    }
    if (typeof store.subscribe !== 'function') {
      throw new TypeError('store.subscribe must be a function');
    }
    
    
    
    store.emitter = createEmitter();
    const currentSubscribe = store.subscribe;
    store.subscribe = listener => {
      const unsubscribeFromEmitter = store.emitter.subscribe(listener);
      const unsubscribeFromStore = currentSubscribe(() => {
        if (store.emitter.isPaused) {
          store.emitter.emit();
          return;
        }
        listener();
      });
      return () => {
        unsubscribeFromStore?.();
        unsubscribeFromEmitter?.();
      };
    };
    stores[name] = store;
    store.subscribe(globalListener);

    
    if (parent) {
      try {
        unlock(store.store).registerPrivateActions(unlock(parent).privateActionsOf(name));
        unlock(store.store).registerPrivateSelectors(unlock(parent).privateSelectorsOf(name));
      } catch (e) {
        
        
        
      }
    }
    return store;
  }

  
  function register(store) {
    registerStoreInstance(store.name, () => store.instantiate(registry));
  }
  function registerGenericStore(name, store) {
    external_wp_deprecated_default()('wp.data.registerGenericStore', {
      since: '5.9',
      alternative: 'wp.data.register( storeDescriptor )'
    });
    registerStoreInstance(name, () => store);
  }

  
  function registerStore(storeName, options) {
    if (!options.reducer) {
      throw new TypeError('Must specify store reducer');
    }
    const store = registerStoreInstance(storeName, () => createReduxStore(storeName, options).instantiate(registry));
    return store.store;
  }
  function batch(callback) {
    
    if (emitter.isPaused) {
      callback();
      return;
    }
    emitter.pause();
    Object.values(stores).forEach(store => store.emitter.pause());
    callback();
    emitter.resume();
    Object.values(stores).forEach(store => store.emitter.resume());
  }
  let registry = {
    batch,
    stores,
    namespaces: stores,
    
    subscribe,
    select,
    resolveSelect,
    suspendSelect,
    dispatch,
    use,
    register,
    registerGenericStore,
    registerStore,
    __unstableMarkListeningStores
  };

  
  
  
  function use(plugin, options) {
    if (!plugin) {
      return;
    }
    registry = {
      ...registry,
      ...plugin(registry, options)
    };
    return registry;
  }
  registry.register(store);
  for (const [name, config] of Object.entries(storeConfigs)) {
    registry.register(createReduxStore(name, config));
  }
  if (parent) {
    parent.subscribe(globalListener);
  }
  const registryWithPlugins = withPlugins(registry);
  lock(registryWithPlugins, {
    privateActionsOf: name => {
      try {
        return unlock(stores[name].store).privateActions;
      } catch (e) {
        
        
        return {};
      }
    },
    privateSelectorsOf: name => {
      try {
        return unlock(stores[name].store).privateSelectors;
      } catch (e) {
        return {};
      }
    }
  });
  return registryWithPlugins;
}

;


 const default_registry = (createRegistry());

;


function is_plain_object_isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]';
}

function is_plain_object_isPlainObject(o) {
  var ctor,prot;

  if (is_plain_object_isObject(o) === false) return false;

  
  ctor = o.constructor;
  if (ctor === undefined) return true;

  
  prot = ctor.prototype;
  if (is_plain_object_isObject(prot) === false) return false;

  
  if (prot.hasOwnProperty('isPrototypeOf') === false) {
    return false;
  }

  
  return true;
}




var cjs = __webpack_require__(66);
var cjs_default = __webpack_require__.n(cjs);
;
let objectStorage;
const storage = {
  getItem(key) {
    if (!objectStorage || !objectStorage[key]) {
      return null;
    }
    return objectStorage[key];
  },
  setItem(key, value) {
    if (!objectStorage) {
      storage.clear();
    }
    objectStorage[key] = String(value);
  },
  clear() {
    objectStorage = Object.create(null);
  }
};
 const object = (storage);

;


let default_storage;
try {
  
  
  
  default_storage = window.localStorage;
  default_storage.setItem('__wpDataTestLocalStorage', '');
  default_storage.removeItem('__wpDataTestLocalStorage');
} catch (error) {
  default_storage = object;
}
 const storage_default = (default_storage);

;















const DEFAULT_STORAGE = storage_default;


const DEFAULT_STORAGE_KEY = 'WP_DATA';


const withLazySameState = reducer => (state, action) => {
  if (action.nextState === state) {
    return state;
  }
  return reducer(state, action);
};


function createPersistenceInterface(options) {
  const {
    storage = DEFAULT_STORAGE,
    storageKey = DEFAULT_STORAGE_KEY
  } = options;
  let data;

  
  function getData() {
    if (data === undefined) {
      
      
      const persisted = storage.getItem(storageKey);
      if (persisted === null) {
        data = {};
      } else {
        try {
          data = JSON.parse(persisted);
        } catch (error) {
          
          
          data = {};
        }
      }
    }
    return data;
  }

  
  function setData(key, value) {
    data = {
      ...data,
      [key]: value
    };
    storage.setItem(storageKey, JSON.stringify(data));
  }
  return {
    get: getData,
    set: setData
  };
}


function persistencePlugin(registry, pluginOptions) {
  const persistence = createPersistenceInterface(pluginOptions);

  
  function createPersistOnChange(getState, storeName, keys) {
    let getPersistedState;
    if (Array.isArray(keys)) {
      
      
      
      
      
      const reducers = keys.reduce((accumulator, key) => Object.assign(accumulator, {
        [key]: (state, action) => action.nextState[key]
      }), {});
      getPersistedState = withLazySameState(build_module_combineReducers(reducers));
    } else {
      getPersistedState = (state, action) => action.nextState;
    }
    let lastState = getPersistedState(undefined, {
      nextState: getState()
    });
    return () => {
      const state = getPersistedState(lastState, {
        nextState: getState()
      });
      if (state !== lastState) {
        persistence.set(storeName, state);
        lastState = state;
      }
    };
  }
  return {
    registerStore(storeName, options) {
      if (!options.persist) {
        return registry.registerStore(storeName, options);
      }

      
      const persistedState = persistence.get()[storeName];
      if (persistedState !== undefined) {
        let initialState = options.reducer(options.initialState, {
          type: '@@WP/PERSISTENCE_RESTORE'
        });
        if (is_plain_object_isPlainObject(initialState) && is_plain_object_isPlainObject(persistedState)) {
          
          
          
          
          
          initialState = cjs_default()(initialState, persistedState, {
            isMergeableObject: is_plain_object_isPlainObject
          });
        } else {
          
          
          initialState = persistedState;
        }
        options = {
          ...options,
          initialState
        };
      }
      const store = registry.registerStore(storeName, options);
      store.subscribe(createPersistOnChange(store.getState, storeName, options.persist));
      return store;
    }
  };
}
persistencePlugin.__unstableMigrate = () => {};
 const persistence = (persistencePlugin);

;


;
const external_React_namespaceObject = window["React"];
;
const external_wp_priorityQueue_namespaceObject = window["wp"]["priorityQueue"];
;
const external_wp_element_namespaceObject = window["wp"]["element"];
;
const external_wp_isShallowEqual_namespaceObject = window["wp"]["isShallowEqual"];
var external_wp_isShallowEqual_default = __webpack_require__.n(external_wp_isShallowEqual_namespaceObject);
;





const Context = (0,external_wp_element_namespaceObject.createContext)(default_registry);
const {
  Consumer,
  Provider
} = Context;


const RegistryConsumer = Consumer;


 const context = (Provider);

;







function useRegistry() {
  return (0,external_wp_element_namespaceObject.useContext)(Context);
}

;


const context_Context = (0,external_wp_element_namespaceObject.createContext)(false);
const {
  Consumer: context_Consumer,
  Provider: context_Provider
} = context_Context;
const AsyncModeConsumer = ( null && (context_Consumer));


 const async_mode_provider_context = (context_Provider);

;





function useAsyncMode() {
  return (0,external_wp_element_namespaceObject.useContext)(context_Context);
}

;








const renderQueue = (0,external_wp_priorityQueue_namespaceObject.createQueue)();






function Store(registry, suspense) {
  const select = suspense ? registry.suspendSelect : registry.select;
  const queueContext = {};
  let lastMapSelect;
  let lastMapResult;
  let lastMapResultValid = false;
  let lastIsAsync;
  let subscriber;
  let didWarnUnstableReference;
  const storeStatesOnMount = new Map();
  function getStoreState(name) {
    var _registry$stores$name;
    
    
    
    return (_registry$stores$name = registry.stores[name]?.store?.getState?.()) !== null && _registry$stores$name !== void 0 ? _registry$stores$name : {};
  }
  const createSubscriber = stores => {
    
    
    const activeStores = [...stores];

    
    
    
    const activeSubscriptions = new Set();
    function subscribe(listener) {
      
      
      
      
      
      
      
      if (lastMapResultValid) {
        for (const name of activeStores) {
          if (storeStatesOnMount.get(name) !== getStoreState(name)) {
            lastMapResultValid = false;
          }
        }
      }
      storeStatesOnMount.clear();
      const onStoreChange = () => {
        
        lastMapResultValid = false;
        listener();
      };
      const onChange = () => {
        if (lastIsAsync) {
          renderQueue.add(queueContext, onStoreChange);
        } else {
          onStoreChange();
        }
      };
      const unsubs = [];
      function subscribeStore(storeName) {
        unsubs.push(registry.subscribe(onChange, storeName));
      }
      for (const storeName of activeStores) {
        subscribeStore(storeName);
      }
      activeSubscriptions.add(subscribeStore);
      return () => {
        activeSubscriptions.delete(subscribeStore);
        for (const unsub of unsubs.values()) {
          
          unsub?.();
        }
        
        renderQueue.cancel(queueContext);
      };
    }

    
    function updateStores(newStores) {
      for (const newStore of newStores) {
        if (activeStores.includes(newStore)) {
          continue;
        }

        
        activeStores.push(newStore);

        
        for (const subscription of activeSubscriptions) {
          subscription(newStore);
        }
      }
    }
    return {
      subscribe,
      updateStores
    };
  };
  return (mapSelect, isAsync) => {
    function updateValue() {
      
      
      
      if (lastMapResultValid && mapSelect === lastMapSelect) {
        return lastMapResult;
      }
      const listeningStores = {
        current: null
      };
      const mapResult = registry.__unstableMarkListeningStores(() => mapSelect(select, registry), listeningStores);
      if (false) {}
      if (!subscriber) {
        for (const name of listeningStores.current) {
          storeStatesOnMount.set(name, getStoreState(name));
        }
        subscriber = createSubscriber(listeningStores.current);
      } else {
        subscriber.updateStores(listeningStores.current);
      }

      
      
      if (!external_wp_isShallowEqual_default()(lastMapResult, mapResult)) {
        lastMapResult = mapResult;
      }
      lastMapSelect = mapSelect;
      lastMapResultValid = true;
    }
    function getValue() {
      
      updateValue();
      return lastMapResult;
    }

    
    
    
    if (lastIsAsync && !isAsync) {
      lastMapResultValid = false;
      renderQueue.cancel(queueContext);
    }
    updateValue();
    lastIsAsync = isAsync;

    
    return {
      subscribe: subscriber.subscribe,
      getValue
    };
  };
}
function useStaticSelect(storeName) {
  return useRegistry().select(storeName);
}
function useMappingSelect(suspense, mapSelect, deps) {
  const registry = useRegistry();
  const isAsync = useAsyncMode();
  const store = (0,external_wp_element_namespaceObject.useMemo)(() => Store(registry, suspense), [registry, suspense]);

  
  
  
  const selector = (0,external_wp_element_namespaceObject.useCallback)(mapSelect, deps);
  const {
    subscribe,
    getValue
  } = store(selector, isAsync);
  const result = (0,external_wp_element_namespaceObject.useSyncExternalStore)(subscribe, getValue, getValue);
  (0,external_wp_element_namespaceObject.useDebugValue)(result);
  return result;
}


function useSelect(mapSelect, deps) {
  
  
  const staticSelectMode = typeof mapSelect !== 'function';
  const staticSelectModeRef = (0,external_wp_element_namespaceObject.useRef)(staticSelectMode);
  if (staticSelectMode !== staticSelectModeRef.current) {
    const prevMode = staticSelectModeRef.current ? 'static' : 'mapping';
    const nextMode = staticSelectMode ? 'static' : 'mapping';
    throw new Error(`Switching useSelect from ${prevMode} to ${nextMode} is not allowed`);
  }

  
  
  
  return staticSelectMode ? useStaticSelect(mapSelect) : useMappingSelect(false, mapSelect, deps);
  
}


function useSuspenseSelect(mapSelect, deps) {
  return useMappingSelect(true, mapSelect, deps);
}

;










const withSelect = mapSelectToProps => (0,external_wp_compose_namespaceObject.createHigherOrderComponent)(WrappedComponent => (0,external_wp_compose_namespaceObject.pure)(ownProps => {
  const mapSelect = (select, registry) => mapSelectToProps(select, ownProps, registry);
  const mergeProps = useSelect(mapSelect);
  return (0,external_React_namespaceObject.createElement)(WrappedComponent, {
    ...ownProps,
    ...mergeProps
  });
}), 'withSelect');
 const with_select = (withSelect);

;








const useDispatchWithMap = (dispatchMap, deps) => {
  const registry = useRegistry();
  const currentDispatchMap = (0,external_wp_element_namespaceObject.useRef)(dispatchMap);
  (0,external_wp_compose_namespaceObject.useIsomorphicLayoutEffect)(() => {
    currentDispatchMap.current = dispatchMap;
  });
  return (0,external_wp_element_namespaceObject.useMemo)(() => {
    const currentDispatchProps = currentDispatchMap.current(registry.dispatch, registry);
    return Object.fromEntries(Object.entries(currentDispatchProps).map(([propName, dispatcher]) => {
      if (typeof dispatcher !== 'function') {
        
        console.warn(`Property ${propName} returned from dispatchMap in useDispatchWithMap must be a function.`);
      }
      return [propName, (...args) => currentDispatchMap.current(registry.dispatch, registry)[propName](...args)];
    }));
  }, [registry, ...deps]);
};
 const use_dispatch_with_map = (useDispatchWithMap);

;










const withDispatch = mapDispatchToProps => (0,external_wp_compose_namespaceObject.createHigherOrderComponent)(WrappedComponent => ownProps => {
  const mapDispatch = (dispatch, registry) => mapDispatchToProps(dispatch, ownProps, registry);
  const dispatchProps = use_dispatch_with_map(mapDispatch, []);
  return (0,external_React_namespaceObject.createElement)(WrappedComponent, {
    ...ownProps,
    ...dispatchProps
  });
}, 'withDispatch');
 const with_dispatch = (withDispatch);

;








const withRegistry = (0,external_wp_compose_namespaceObject.createHigherOrderComponent)(OriginalComponent => props => (0,external_React_namespaceObject.createElement)(RegistryConsumer, null, registry => (0,external_React_namespaceObject.createElement)(OriginalComponent, {
  ...props,
  registry: registry
})), 'withRegistry');
 const with_registry = (withRegistry);

;







const useDispatch = storeNameOrDescriptor => {
  const {
    dispatch
  } = useRegistry();
  return storeNameOrDescriptor === void 0 ? dispatch : dispatch(storeNameOrDescriptor);
};
 const use_dispatch = (useDispatch);

;





function dispatch_dispatch(storeNameOrDescriptor) {
  return default_registry.dispatch(storeNameOrDescriptor);
}

;





function select_select(storeNameOrDescriptor) {
  return default_registry.select(storeNameOrDescriptor);
}

;

























const build_module_combineReducers = combine_reducers_combineReducers;


const build_module_resolveSelect = default_registry.resolveSelect;


const suspendSelect = default_registry.suspendSelect;


const subscribe = default_registry.subscribe;


const registerGenericStore = default_registry.registerGenericStore;


const registerStore = default_registry.registerStore;


const use = default_registry.use;


const register = default_registry.register;

})();

(window.wp = window.wp || {}).data = __webpack_exports__;
 })()
;