import { buildSchema } from 'graphql';
import { makeExecutableSchema } from 'graphql-tools';

import { allFieldsPublic, ensureAuthorizationSetup } from '../authorization';

const testSchema = [
  `

type TestType {
  id: ID!
  fieldA: String
  fieldB: String 
}

type Query {
  test: TestType
}

schema {
  query: Query
}

`,
];

let testSchemaObject;

const resolvers = {
  Query: {
    test: () => {
      return {
        id: 1,
        fieldA: 'sample field a',
        fieldB: 'sample field b',
      };
    },
  },
};

beforeEach(() => {
  testSchemaObject = buildSchema(testSchema.join('\n'));
});

describe('ensureAuthorizationSetup', () => {
  it('should throw if there is no authorization setup for the schema', () => {
    const executableSchema = makeExecutableSchema({
      typeDefs: testSchema,
      resolvers,
    });
    expect(() => {
      ensureAuthorizationSetup(executableSchema);
    }).toThrow(/Authorization not set up/);
  });

  it('should not throw if there is authorization setup for the schema', () => {
    const resolversWithAuthorization = {
      ...resolvers,
      TestType: allFieldsPublic({
        schemaObject: testSchemaObject,
        typeName: 'TestType',
      })({}),
    };
    const executableSchema = makeExecutableSchema({
      typeDefs: testSchema,
      resolvers: resolversWithAuthorization,
    });
    ensureAuthorizationSetup(executableSchema);
  });
});
