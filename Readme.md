# Vad

JS object validation

## Start

## Usage

### validator

```js
const isString = vad.isString('value is not a string')
const lenRange = vad.lenRange({ min: 5 }, 'length lower then 5')

isString('123').then((res) => res === undefined)

isString(123).then((res) => res === 'value is not a string')
```

### verify

```js
vad.verify('12345', [isString, lenRange]).then((res) => res === undefined)

vad
  .verify(123, [isString, lenRange])
  .then((res) => res === 'value is not a string')

vad
  .verify('123', [isString, lenRange])
  .then((res) => res === 'length lower then 5')

// customer validator
vad.verify(42, [(val) => (val < 50 || val > 200 ? 'out of range' : undefined)])
```

### verifyGroup

```js
const validator = {
  name: [
    vad.required('name is required'),
    vad.isString('name is not a  string'),
  ],
  age: [
    vad.isNumber('age is not a number'),
    vad.range({ max: 30, min: 16 }, 'age out of range'),
  ],
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

vad
  .verifyGroup(
    {
      name: 'name',
      age: 26,
      score: 6,
      addr: { city: 'city name ', street: 'street name' },
    },
    validator
  )
  .then((msg) => msg === undefined)
```

## Api

```ts
interface nested {
  [key: string]: string | nested
}
type validatorReturn = nested | string | undefined

type validator = (value: any) => validatorReturn | Promise<validatorReturn>

interface vad {
  required: (msg?: string) => validator // check value is undefine or ''

  isEmpty: (msg?: string) => validator // empty value: null, true, false, '', [], {}, new Map(), new Set()
  isNotEmpty: (msg?: string) => validator

  isEq: (opt: any, msg?: string) => validator // compare use a === b
  isNotEq: (opt: any, msg?: string) => validator

  pattern: (opt: RegExp, msg?: string) => validator
  isEmail: (msg?: string) => validator
  isMobile: (msg?: string) => validator

  //  rangeOpt = { max: number; min: number } | default max = Infinity, min = -Infinity
  range: (opt: rangeOpt, msg?: string) => validator
  lenRange: (opt: rangeOpt, msg?: string) => validator

  isTypeof: (opt: string, msg?: string) => validator
  isString: (msg?: string) => validator
  isNumber: (msg?: string) => validator

  nested: (opt: validator[], msg?: string) => validator
  or: (opt: validator[], msg?: string) => validator
  and: (opt: validator[], msg?: string) => validator

  // verify
  verify: (value: any, validators: validator[]) => Promise<validatorReturn>
  verifyGroup: (data: Record<string, any>, rules: Record<string, validator[]>) => Promise<validatorReturn> 
}

```

## Build

```sh
esbuild --bundle ./index.ts --target=es6 --minify --format=esm --outfile=./dist/index.js
esbuild --bundle ./index.ts --target=es6 --minify --format=cjs --outfile=./dist/index.common.js

# test
Deno test ./test.ts
```
