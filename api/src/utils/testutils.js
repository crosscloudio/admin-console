export async function createSampleEntities(models) {
  const { organizations, users } = models;

  const firstOrganization = await organizations.create({
    display_name: 'Archivers Inc.',
    users_limit: 5,
  });
  const secondOrganization = await organizations.create({
    display_name: 'Doodle',
  });
  const userWithoutAdminRights = await users.create({
    organization_id: firstOrganization.id,
    email: 'john@shmith.com',
    name: 'John Smith',
    roles: ['user'],
    is_enabled: true,
    public_key: `-----BEGIN PUBLIC KEY-----
  MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEKjdtuGHb5Q/96hRnbYAaIOJonznbWfy/
  k2Wxcjx4LrBXc8K2w+jFXwnnmg1l2jpz243x5uRyDVFW63TUAuPpCA==
  -----END PUBLIC KEY-----`,
  });

  const userWithoutPublicKey = await users.create({
    organization_id: firstOrganization.id,
    email: 'mathew@example.com',
    name: 'Mathew Taylor',
    roles: ['user'],
    is_enabled: true,
  });

  const userWithAdminRights = await users.create({
    organization_id: firstOrganization.id,
    email: 'admin@company.com',
    name: 'Patric Doe',
    roles: ['user', 'administrator'],
    is_enabled: true,
    public_key: null,
  });

  const userFromDifferentOrganization = await users.create({
    organization_id: secondOrganization.id,
    is_enabled: true,
    email: 'user.from@different.com',
    name: 'Anna Maj',
    roles: ['user', 'administrator'],
    public_key: `-----BEGIN PUBLIC KEY-----
  MFYwEAYHKoZIzj0CAQYFK4EEAAoDQgAEDUXUpqBf4LqUQE8Eq61ps14cz4CeXi1a
  STBseElQIHBn72EUD+8FsRoAg8/oS7JgJaScB+3AdTFRf/BnoCoBiQ==
  -----END PUBLIC KEY-----`,
  });

  return {
    firstOrganization,
    secondOrganization,
    userWithoutAdminRights,
    userWithoutPublicKey,
    userWithAdminRights,
    userFromDifferentOrganization,
  };
}
