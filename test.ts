import {
  assertEquals,
  assertStrictEquals,
  assertThrowsAsync,
  assert,
} from 'https://deno.land/std/testing/asserts.ts'

import vad from './index.ts'

Deno.test('validator | empty message', () => {
  const isString = vad.isString()
  return isString(false).then((msg) => assertStrictEquals(msg as string, 'invalid | string'))
})

Deno.test('validator | isEq', () => {
  const isEqAAA = vad.isEq('AAA', 'is not AAA')

  return isEqAAA('aaa')
    .then((msg) => assertStrictEquals(msg, 'is not AAA'))
    .then(() => isEqAAA('AAA'))
    .then((msg) => assertStrictEquals(msg, undefined))
})

Deno.test('validator | isNotEq', () => {
  const isNotAAA = vad.isNotEq('AAA', 'is AAA')

  return isNotAAA('dsa')
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => isNotAAA('AAA'))
    .then((msg) => assertStrictEquals(msg, 'is AAA'))
})

Deno.test('validator | isNumber', () => {
  const isNumber = vad.isNumber('not a number')

  return isNumber(123)
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => isNumber('123'))
    .then((msg) => assertStrictEquals(msg, 'not a number'))
})

Deno.test('validator | isString', () => {
  const isString = vad.isString('not a string')

  return isString('123')
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => isString(123))
    .then((msg) => assertStrictEquals(msg, 'not a string'))
})

Deno.test('validator | typeof', () => {
  const isfunction = vad.isTypeof('function', 'type error')

  return isfunction(() => {})
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => isfunction('123'))
    .then((msg) => assertStrictEquals(msg, 'type error'))
})

Deno.test('validator | required', () => {
  const required = vad.required('required')

  return required('valur')
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => required(''))
    .then((msg) => assertStrictEquals(msg, 'required'))
    .then(() => required())
    .then((msg) => assertStrictEquals(msg, 'required'))
})

Deno.test('validator | range', () => {
  const inRange = vad.range({ max: 20, min: 10 }, 'out of range')

  return inRange(15)
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => inRange(6))
    .then((msg) => assertStrictEquals(msg, 'out of range'))
    .then(() => inRange(60))
    .then((msg) => assertStrictEquals(msg, 'out of range'))
})

Deno.test('validator | len range', () => {
  const lenInRange = vad.lenRange({ max: 6, min: 3 }, 'len out of range')

  return lenInRange('123')
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => lenInRange([1, 2]))
    .then((msg) => assertStrictEquals(msg, 'len out of range'))
    .then(() => lenInRange({ length: 8 }))
    .then((msg) => assertStrictEquals(msg, 'len out of range'))
})

Deno.test('validator | pattern', () => {
  const pattern = vad.pattern(/^\d[a-z]\d$/, 'pattern error')

  return pattern('1a1')
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => pattern('aaa'))
    .then((msg) => assertStrictEquals(msg, 'pattern error'))
})

Deno.test('validator | isEmail', () => {
  const isEmail = vad.isEmail('pattern error')

  return isEmail('name@domain.com')
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => isEmail('nema@domain.c'))
    .then((msg) => assertStrictEquals(msg, 'pattern error'))
})

Deno.test('validator | isMobile', () => {
  const isMobile = vad.isMobile('pattern error')

  return isMobile('13512345678')
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => isMobile('121521451221'))
    .then((msg) => assertStrictEquals(msg, 'pattern error'))
})

Deno.test('validator | isEmpty', () => {
  const isEmpty = vad.isEmpty()

  const emptyArr = [null, true, false, '', [], {}, new Map(), new Set()]
  const notEmptyArr = ['123', [1], new Map().set('1', 1), new Set().add(1)]

  return Promise.all(notEmptyArr.map(isEmpty))
    .then((msg) => {
      const val = msg.every((v) => v === 'invalid | empty')
      assert(val)
    })

    .then(() => Promise.all(emptyArr.map(isEmpty)))
    .then((msg) => {
      const val = msg.every((v) => v === undefined)
      assert(val)
    })
})

// compose

Deno.test('compose | or', () => {
  const numberOrboolean = vad.or([vad.isNumber(), vad.isTypeof('boolean')], 'not number or boolean')

  return numberOrboolean(1123)
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => numberOrboolean(false))
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => numberOrboolean('aaa'))
    .then((msg) => assertStrictEquals(msg, 'not number or boolean'))
})

Deno.test('compose | and', () => {
  const numberAnd = vad.and([vad.isNumber(), vad.range({ min: 30 })], 'not number or less then 30')

  return numberAnd('35')
    .then((msg) => assertStrictEquals(msg, 'not number or less then 30'))
    .then(() => numberAnd(23))
    .then((msg) => assertStrictEquals(msg, 'not number or less then 30'))
    .then(() => numberAnd(35))
    .then((msg) => assertStrictEquals(msg, undefined))
})

Deno.test('compose | nested', () => {
  const nested = vad.nested({
    name: [vad.isString('name is not a string')],
    id: [vad.range({ max: 3, min: 1 }, 'id is out of range')],
  })

  return nested({ name: '123321', id: 1 })
    .then((msg) => assertStrictEquals(msg, undefined))
    .then(() => nested())
    .then((msg) => assertEquals(msg, { name: 'name is not a string', id: 'id is out of range' }))
    .then(() => nested({ name: 'name' }))
    .then((msg) => assertEquals(msg, { id: 'id is out of range' }))
})

// verify
Deno.test('verify | group', () => {
  const validator = {
    name: [vad.required('name is required'), vad.isString('name is not a  string')],
    age: [vad.isNumber('age is not a number'), vad.range({ max: 30, min: 16 }, 'age out of range')],
    score: [
      vad.isNumber(),
      vad.or(
        [vad.range({ max: 15 }), vad.range({ min: 30 })],
        'score must lower then 15 or greater then 30'
      ),
    ],
    addr: [
      vad.nested({
        city: [vad.required(), vad.isString()],
        street: [vad.required(), vad.isString()],
      }),
    ],
  }

  return vad
    .verifyGroup(
      { name: 'name', age: 26, score: 6, addr: { city: 'city', street: '123' } },
      validator
    )
    .then((msg) => assertEquals(msg, undefined))
    .then(() => vad.verifyGroup(undefined, validator))
    .then((msg) =>
      assertEquals(msg, {
        name: 'name is required',
        age: 'age is not a number',
        score: 'invalid | number',
        addr: { city: 'invalid | required', street: 'invalid | required' },
      })
    )
    .then(() =>
      vad.verifyGroup({ name: 'name', age: 24, score: 60, addr: { city: 'city' } }, validator)
    )
    .then((msg) => assertEquals(msg, { addr: { street: 'invalid | required' } }))
})

// async
Deno.test('verify | async', () => {
  return vad
    .verify('123', [
      (val) => new Promise((resolve) => setTimeout(() => resolve('allways err'), 100)),
    ])
    .then((msg) => assertStrictEquals(msg, 'allways err'))
    .then(() =>
      vad.verify('123', [
        (val) => new Promise((resolve) => setTimeout(() => resolve(vad.isString()(val)), 100)),
      ])
    )
    .then((msg) => assertStrictEquals(msg, undefined))
})

// type check
Deno.test('verify | type check', () => {
  const arg: any = undefined
  return assertThrowsAsync(
    () => vad.verifyGroup(arg, { name: arg }),
    TypeError,
    'validators is not an Array'
  )
    .then(() =>
      assertThrowsAsync(
        () => vad.verifyGroup(arg, { name: [arg] }),
        TypeError,
        'validator is not a function'
      )
    )
    .then(() =>
      assertThrowsAsync(() => vad.verifyGroup(arg, arg as any), TypeError, 'rules is invalid')
    )
    .then(() => {})
})
