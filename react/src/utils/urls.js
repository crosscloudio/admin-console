export const userPageUrl = (user, subpage) => {
  let url = `/user/${user.id}`;
  if (subpage) {
    url += `/${subpage}`;
  }
  return url;
};
