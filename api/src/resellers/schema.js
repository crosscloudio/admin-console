import { makeExecutableSchema } from 'graphql-tools';

export const schema = [
  `
type Query {
  # Get an organization by id. Requires token for a specific reseller.
  # Returns null if the organization was created by a different reseller.
  organization(reseller_id: String!, id: String!): Organization
}

type Mutation {
  # Reseller mutations

  createReseller(input: CreateResellerInput): Reseller
  deleteReseller(id: String!): Boolean

  # Organization mutations

  createOrganization(input: CreateOrganizationInput!): Organization
  disableOrganization(reseller_id: String!, id: String!): Organization
  enableOrganization(reseller_id: String!, id: String!): Organization
  deleteOrganization(reseller_id: String!, id: String!): Boolean
  # Set the number of licenses
  setUsersLimit(input: SetUserLimitInput!): Organization
}

input CreateResellerInput {
  # allow to optionally save a reseller id from the external system
  external_id: String
}

type Reseller {
  id: String
  external_id: String
}

input CreateOrganizationInput {
  reseller_id: String!

  # Should it be required? Will it be possible to set it by ODIN or should
  # it be always automatically generated?
  company_name: String

  # Set the value of "Administrator contact email" of the organization.
  # It won't be used as an email of the first admin user in the organization
  # a "superadmin" account is created instead
  admin_contact_email: String

  # number of available licenses
  users_limit: Int!
}

type Organization {
  id: String!
  reseller_id: String

  # is this one required
  display_name: String!

  is_enabled: Boolean!
  # number of used licenses
  users_count: Int
  # number of available licenses
  users_limit: Int

  # An URL for admin auto-login
  admin_login_url: String
}

input SetUserLimitInput {
  reseller_id: String!
  id: String!
  limit: Int!
}
`,
];

const resolvers = {
  Query: {
    organization(root, { reseller_id, id }, { resellersHelper }) {
      return resellersHelper.getOrganization(reseller_id, id);
    },
  },

  Mutation: {
    createReseller(root, { input }, { resellersHelper }) {
      // allow input to be not provided
      return resellersHelper.createReseller(input);
    },

    deleteReseller(root, { id }, { resellersHelper }) {
      return resellersHelper.deleteReseller(id);
    },

    createOrganization(root, { input }, { resellersHelper }) {
      return resellersHelper.createOrganization(input);
    },

    disableOrganization(root, { reseller_id, id }, { resellersHelper }) {
      return resellersHelper.disableOrganization(reseller_id, id);
    },

    enableOrganization(root, { reseller_id, id }, { resellersHelper }) {
      return resellersHelper.enableOrganization(reseller_id, id);
    },

    deleteOrganization(root, { reseller_id, id }, { resellersHelper }) {
      return resellersHelper.deleteOrganization(reseller_id, id);
    },

    setUsersLimit(root, { input }, { resellersHelper }) {
      return resellersHelper.setUsersLimit(input);
    },
  },

  Organization: {
    admin_login_url: (organization, args, { resellersHelper }) => {
      return resellersHelper.getAdminLoginUrl(organization);
    },
  },
};

const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});

export default executableSchema;
