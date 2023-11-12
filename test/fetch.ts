import * as Appear from "../src/index";

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
      }),
    })
      .then((result) => result.json())
      .then(resolve)
      .catch(reject);
  });
}

(async () => {
  Appear.init(
    {
      apiKey: "123",
    },
    {
      name: "My-fetch-reporter",
    }
  );

  const result = await doFetch();

  console.log("got result:", result);
})();
