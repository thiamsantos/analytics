import test from 'ava'
import sinon from 'sinon'
import delay from './utils/delay'
import Analytics from '../src'

test.beforeEach((t) => {
  t.context.sandbox = sinon.createSandbox()
})

test('Plugin with [x]Start should enrich [x]Start payloads', async (t) => {
  let secondPayload
  let finalPayload
  Analytics({
    app: 'appname',
    version: 100,
    plugins: [
      {
        NAMESPACE: 'plugin-one',
        initializeStart: ({ payload }) => {
          return {
            ...payload,
            ...{
              foo: 'baz'
            }
          }
        }
      },
      {
        NAMESPACE: 'plugin-two',
        initializeStart: ({ payload }) => {
          secondPayload = payload
          return {
            ...payload,
            ...{
              fizz: 'pop'
            }
          }
        }
      },
      {
        NAMESPACE: 'plugin-three',
        initializeStart: ({ payload }) => {
          finalPayload = payload
        }
      },
    ]
  })

  await delay(1000)

  t.deepEqual(secondPayload, {
    type: 'initializeStart',
    plugins: [ 'plugin-one', 'plugin-two', 'plugin-three' ],
    foo: 'baz'
  })

  t.deepEqual(finalPayload, {
    type: 'initializeStart',
    plugins: [ 'plugin-one', 'plugin-two', 'plugin-three' ],
    foo: 'baz',
    fizz: 'pop'
  })
})

test('Plugin (not xStart) returning values should NOT enrich other payloads', async (t) => {
  let firstPayload
  let secondPayload
  let thirdPayload
  let fourthPayload
  const analytics = Analytics({
    plugins: [
      {
        NAMESPACE: 'enrich-four',
        'track:plugin-four': ({ payload }) => {
          firstPayload = payload
          return {
            ...payload,
            ...{
              addToFourOnly: 'hello'
            }
          }
        }
      },
      {
        NAMESPACE: 'plugin-one',
        track: ({ payload }) => {
          firstPayload = payload
          return {
            ...payload,
            ...{
              foo: 'baz'
            }
          }
        }
      },
      {
        NAMESPACE: 'plugin-two',
        track: ({ payload }) => {
          secondPayload = payload
          return {
            ...payload,
            ...{
              fizz: 'pop'
            }
          }
        }
      },
      {
        NAMESPACE: 'plugin-three',
        track: ({ payload }) => {
          thirdPayload = payload
        }
      },
      {
        NAMESPACE: 'plugin-four',
        track: ({ payload }) => {
          fourthPayload = payload
        }
      },
    ]
  })

  analytics.track('foobar')

  await delay(1000)

  const originalPayload = {
    type: 'track',
    event: 'foobar',
    properties: {},
    options: {},
    userId: undefined,
    anonymousId: undefined,
    // meta: { timestamp: 1571017886122 }
  }

  delete firstPayload.meta
  t.deepEqual(firstPayload, originalPayload)

  delete secondPayload.meta
  t.deepEqual(secondPayload, originalPayload)

  delete thirdPayload.meta
  t.deepEqual(thirdPayload, originalPayload)

  delete fourthPayload.meta
  t.deepEqual(fourthPayload, {
    type: 'track',
    event: 'foobar',
    properties: {},
    options: {},
    userId: undefined,
    anonymousId: undefined,
    addToFourOnly: 'hello'
  })
})

test('Namespace plugin should enrich specific data', async (t) => {
  let payloadOne
  let payloadOriginal
  const analytics = Analytics({
    app: 'appname',
    version: 100,
    plugins: [
      {
        NAMESPACE: 'enrich-one',
        // Only enrich plugin-one
        'track:plugin-one': ({ payload }) => {
          return {
            ...payload,
            ...{
              foo: 'baz'
            }
          }
        }
      },
      {
        NAMESPACE: 'plugin-one',
        track: ({ payload }) => {
          payloadOne = payload
        }
      },
      {
        NAMESPACE: 'plugin-two',
        track: ({ payload }) => {
          payloadOriginal = payload
        }
      },
    ]
  })

  analytics.track('lol')

  await delay(1000)

  delete payloadOne.meta
  t.deepEqual(payloadOne, {
    type: 'track',
    event: 'lol',
    properties: {},
    options: {},
    userId: undefined,
    anonymousId: undefined,
    foo: 'baz',
  })

  delete payloadOriginal.meta
  t.deepEqual(payloadOriginal, {
    type: 'track',
    event: 'lol',
    properties: {},
    options: {},
    userId: undefined,
    anonymousId: undefined
  })
})

test('Multiple Namespaced plugins should enrich specific data', async (t) => {
  let payloadOne
  let payloadTwo
  const analytics = Analytics({
    app: 'appname',
    version: 100,
    plugins: [
      {
        NAMESPACE: 'enrich-one',
        // Only enrich plugin-one
        'track:plugin-one': ({ payload }) => {
          return {
            ...payload,
            ...{
              foo: 'baz'
            }
          }
        }
      },
      {
        NAMESPACE: 'enrich-one-b',
        // Only enrich plugin-one
        'track:plugin-one': ({ payload }) => {
          return {
            ...payload,
            ...{
              wowowow: 'nice'
            }
          }
        }
      },
      {
        NAMESPACE: 'enrich-two',
        // Only enrich plugin-one
        'track:plugin-two': ({ payload }) => {
          return {
            ...payload,
            ...{
              awesome: 'sauce'
            }
          }
        }
      },
      {
        NAMESPACE: 'plugin-one',
        track: ({ payload }) => {
          payloadOne = payload
        }
      },
      {
        NAMESPACE: 'plugin-two',
        track: ({ payload }) => {
          payloadTwo = payload
        }
      },
    ]
  })

  analytics.track('lol')

  await delay(1000)

  delete payloadOne.meta
  t.deepEqual(payloadOne, {
    type: 'track',
    event: 'lol',
    properties: {},
    options: {},
    userId: undefined,
    anonymousId: undefined,
    foo: 'baz',
    wowowow: 'nice'
  })

  delete payloadTwo.meta
  t.deepEqual(payloadTwo, {
    type: 'track',
    event: 'lol',
    properties: {},
    options: {},
    userId: undefined,
    anonymousId: undefined,
    awesome: 'sauce'
  })
})
