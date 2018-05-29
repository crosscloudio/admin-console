import { validatePolicy } from '../validators';

describe('validators', () => {
  describe('validatePolicy', () => {
    it('should throw if the policy type is unsupported', () => {
      try {
        validatePolicy({
          is_enabled: true,
          name: 'sample mime type policy',
          type: 'a_new_type',
          criteria: 'sample criteria',
        });
      } catch (error) {
        expect(error.message).toBe('Unsupported policy type: a_new_type');
      }
    });

    it('should throw if a prohibited extensions policy has incorrect chars', () => {
      try {
        validatePolicy({
          is_enabled: true,
          name: 'sample policy',
          type: 'fileextension',
          criteria: 'ex..t',
        });
      } catch (error) {
        expect(error.message).toBe('Extension contains invalid character: .');
      }
    });

    it('should not throw if a prohibited extensions policy is correct', () => {
      expect(
        validatePolicy({
          is_enabled: true,
          name: 'sample policy',
          type: 'fileextension',
          criteria: 'exe',
        })
      ).toBe(undefined);
    });

    it('should throw if a mime types policy has incorrect criteria', () => {
      try {
        validatePolicy({
          is_enabled: true,
          name: 'sample mime type policy',
          type: 'mimetype',
          criteria: 'application/incorrect-mime-type',
        });
      } catch (error) {
        expect(error.message).toBe(
          'Incorrect mime type: application/incorrect-mime-type'
        );
      }
    });
  });
});
