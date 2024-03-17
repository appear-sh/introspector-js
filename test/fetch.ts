import axios from "axios"

import * as Appear from "../src/index"

function doFetch() {
  return new Promise((resolve, reject) => {
    fetch("http://127.0.0.1:9999/helloworld", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "Login",
        username: "adam@boxxen.org",
        password: "mysecretpassword",
        somethingElseStringArray: ["hello"],
        multiArray: ["hello", 5, 5],
        emptyArrray: [],
        nested: {
          one: "two",
        },
        bo: true,
        no: undefined,
        null: null,
        complexArray: [{ hello: 5, world: { nested: { yeah: [1, 2, 3] } } }],
        wasFetch: true,
      }),
    })
      .then((result) => result.json())
      .then(resolve)
      .catch(reject)
  })
}

function doAxiosNodeNative() {
  return new Promise((resolve, reject) => {
    axios
      .post("http://127.0.0.1:9999/helloworld", {
        type: "Login",
        username: "adam@boxxen.org",
        password: "mysecretpassword",
        somethingElseStringArray: ["hello"],
        multiArray: ["hello", 5, 5],
        emptyArrray: [],
        nested: {
          one: "two",
        },
        bo: true,
        no: undefined,
        null: null,
        complexArray: [{ hello: 5, world: { nested: { yeah: [1, 2, 3] } } }],
        wasNative: true,
      })
      .then((result) => result.data)
      .then(resolve)
      .catch(reject)
  })
}

;(async () => {
  await Appear.init({
    apiKey: "example-testing-key",
    environment: "test",
    sendImmediately: true,
  })

  const fetchResult = await doFetch()
  console.log("got result for fetch:", fetchResult)

  const nativeResult = await doAxiosNodeNative()
  console.log("got result for axios/native:", nativeResult)
})()
