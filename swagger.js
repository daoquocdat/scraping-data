const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Get data API",
      version: "1.0.0",
      description: "Get API information",
    },
    servers: [
      {
        url: "http://localhost:3002",
        description: "Development server",
      },
    ],
    components: {
      schemas: {},
    },
    responses: {
      400: {
        description: "Bad request.",
        contents: "application/json",
      },
      401: {
        description: "Unauthorized.",
        contents: "application/json",
      },
      404: {
        description: "Not found.",
        contents: "application/json",
      },
    },
  },
  apis: ["./index.js"],
};

export { options };
