let mockArgs;

function getMockArgs() {
  return mockArgs;
}

function mockFetch(...args) {
  mockArgs = args;

  return Promise.resolve({
    ok: true,
    status: 200,
    text: Promise.resolve('mocked response'),
  });
}

mockFetch.getMockArgs = getMockArgs;

module.exports = mockFetch;
