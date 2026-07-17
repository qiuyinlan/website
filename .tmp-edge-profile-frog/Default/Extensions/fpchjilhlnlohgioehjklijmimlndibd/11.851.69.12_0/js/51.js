class ArrayPrototypeExtensionSelfReferenceTests extends AbstractTestCase{"@test should not create non-Symbol, enumerable properties that refer to itself"(){function e(){}NativeArray.apply(e.prototype);let t=new e;for(let e in t){this.assert.notStrictEqual(t[e],t,`Property "${e}" is an enumerable part of the prototype
        so must not refer back to the original array.
        Otherwise code that explores all properties,
        such as jQuery.extend and other "deep cloning" functions,
        will get stuck in an infinite loop.
        `.replace(/\s+/g," "))}}}moduleFor(`NativeArray: apply`,ArrayPrototypeExtensionSelfReferenceTests);