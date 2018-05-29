import { checkPassword } from '../passwords';

describe('checkPassword', () => {
  it('should return true if password compares to its hash', async () => {
    expect(
      await checkPassword(
        'sample password',
        // 'sample password' with 4 rounds
        '$2a$04$eApl0BQBqI5kkdr9vghnwuygqk9cdHCM1gbC9V96inXDr7HYbwVQ6'
      )
    ).toBe(true);
  });

  it("should return false if password does'nt compare to its hash", async () => {
    expect(
      await checkPassword(
        'a password',
        // 'sample password' with 4 rounds
        '$2a$04$eApl0BQBqI5kkdr9vghnwuygqk9cdHCM1gbC9V96inXDr7HYbwVQ6'
      )
    ).toBe(false);
  });

  it('should return false if the hash is empty', async () => {
    expect(await checkPassword('sample password', '')).toBe(false);

    expect(await checkPassword('sample password', null)).toBe(false);
  });

  it('should return false if the password is empty', async () => {
    expect(
      await checkPassword(
        '',
        // 'sample password' with 4 rounds
        '$2a$04$eApl0BQBqI5kkdr9vghnwuygqk9cdHCM1gbC9V96inXDr7HYbwVQ6'
      )
    ).toBe(false);

    expect(
      await checkPassword(
        null,
        // 'sample password' with 4 rounds
        '$2a$04$eApl0BQBqI5kkdr9vghnwuygqk9cdHCM1gbC9V96inXDr7HYbwVQ6'
      )
    ).toBe(false);
  });
});
