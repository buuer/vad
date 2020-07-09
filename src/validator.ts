// CONST
const UNDF = void 0

const reg = {
  email: /^\w+@\w+\.\w{2,6}$/,
  mobile: /^1[3-9]\d{9}$/, // +86 phone num
  // url: /url/,
}

// types
type checkFn<T = any, V = any> = (val: V, opt: T) => boolean | Promise<boolean>

type rangeOpt = { max?: number; min?: number }

interface nested {
  [key: string]: string | nested
}

type validatorReturn = nested | string | undefined
type validator = (val: any) => validatorReturn | Promise<validatorReturn>

// type  = Record<string, string>

// haplerFn
const validatorCall = (checkFn: checkFn, option: unknown, errorMsg: string) => (value?: unknown) =>
  Promise.resolve(checkFn(value, option)).then((isValid) => (isValid ? UNDF : errorMsg))

const checkVal = <T>(name: string, fn: checkFn<T>, option?: T) => (
  errorMsg = `invalid | ${name}`
) => validatorCall(fn, option, errorMsg)

const checkValRt = <T>(name: string, fn: checkFn<T>) => (
  option?: T,
  errorMsg = `invalid | ${name}`
) => validatorCall(fn, option, errorMsg)

// checkFn
const valEq: checkFn = (val, compare) => val === compare
const valNotEq: checkFn = (val, compare) => val !== compare

const valRange: checkFn<rangeOpt> = (val, { min = -Infinity, max = Infinity } = {} as rangeOpt) =>
  typeof val === 'number' && val >= min && val <= max

const valTest: checkFn<RegExp> = (val, reg) => !!reg && reg.test(val as string)

let typeofVal = typeof ''
type typeofTypeof = typeof typeofVal
const valType: checkFn<typeofTypeof> = (val, type) => typeof val === type

const valIsEmpty = (val: any) => {
  if (Array.isArray(val) || typeof val === 'string') {
    return val.length === 0
  }

  if (val instanceof Map || val instanceof Set) {
    return val.size === 0
  }

  for (const key in val) {
    if (Object.prototype.hasOwnProperty.call(val, key)) {
      return false
    }
  }

  return true
}

const valOr = (val: unknown, validators: validator[]) => {
  const checkAll = validators.map((validator) => validator(val))
  return Promise.all(checkAll).then((isValidArr) => isValidArr.includes(UNDF))
}

const valAnd = (val: unknown, validators: validator[]) => {
  const checkAll = validators.map((validator) => validator(val))
  return Promise.all(checkAll).then((isValidArr) => isValidArr.every((v) => v === UNDF))
}

/**
 * validator
 */

export const required = checkVal('required', (val) => val !== UNDF && val !== '')

export const isEmpty = checkVal('empty', valIsEmpty)
export const isNotEmpty = checkVal('empty', (val) => !valIsEmpty(val))

export const isEq = checkValRt('isEq', valEq)
export const isNotEq = checkValRt('isNotEq', valNotEq)

export const pattern = checkValRt('pattern', valTest)
export const isEmail = checkVal('email', valTest, reg.email)
export const isMobile = checkVal('mobile', valTest, reg.mobile)

export const range = checkValRt('range', valRange)
export const lenRange = checkValRt('lenRange', (val: any, opt: rangeOpt) =>
  valRange(val.length, opt)
)

export const isTypeof = checkValRt('type', valType)
export const isString = checkVal('string', valType, 'string')
export const isNumber = checkVal('number', valType, 'number')

/**
 * compose
 */

export const nested = (rules: Record<string, validator[]>) => (val?: Record<string, any>) =>
  verifyGroup(val, rules)

export const or = checkValRt('or', valOr)
export const and = checkValRt('and', valAnd)
/**
 * verify
 */

export const verify = (val: unknown, validators: validator[]) => {
  if (!Array.isArray(validators)) throw new TypeError('validators is not an Array')

  return new Promise<nested | string | undefined>((resolve, reject) => {
    const asyncArr = validators.map((validator) => {
      if (typeof validator !== 'function') throw new TypeError('validator is not a function')

      return Promise.resolve(validator(val)).then((msg) => {
        msg !== UNDF && resolve(msg)
      })
    })

    // all checked resolve undefind
    Promise.all(asyncArr).then(() => resolve(), reject)
  })
}

export const verifyGroup = (
  data = {} as Record<string, any>,
  rules: Record<string, validator[]>
) => {
  if (typeof rules !== 'object') throw new TypeError('rules is invalid')
  if (typeof data !== 'object') data = {}

  const asyncArr = Object.keys(rules).map((key) =>
    verify(data[key], rules[key]).then((msg) => [key, msg] as [string, string | undefined])
  )

  return Promise.all(asyncArr).then((vadResArr) => {
    let vadRes: nested = {}
    let isVaild = true

    vadResArr.forEach(([key, message]) => {
      if (message !== UNDF) {
        vadRes[key] = message
        isVaild = false
      }
    })

    return isVaild ? UNDF : vadRes
  })
}
