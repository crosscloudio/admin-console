const sentMails = [];

function createTransport() {
  return {
    async sendMail(mail) {
      sentMails.push(mail);
    },
  };
}

module.exports = {
  createTransport,
  getSentMails() {
    return sentMails;
  },
};
