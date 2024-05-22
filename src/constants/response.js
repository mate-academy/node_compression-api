const response = {
  200: {
    statusCode: 200,
  },
  400: {
    statusCode: 400,
    messages: {
      encoding: 'Inappropriate encoding extension.',
      method: `It should be POST request for "/compress"`,
    },
  },
  404: {
    statusCode: 404,
    messages: {
      notFound: 'Page not found',
    },
  },
  503: {
    statusCode: 503,
    messages: {
      service: 'Service unavailable',
    },
  },
};

module.exports = { response };
