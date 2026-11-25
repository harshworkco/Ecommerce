const serverless = require("serverless-http");
const app = require("./server");
const { end } = require("./src/config/db");

const handler = serverless(app);

module.exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  try {
    const result = await handler(event, context);
    return result;
  } finally {
    await end();
  }
};
