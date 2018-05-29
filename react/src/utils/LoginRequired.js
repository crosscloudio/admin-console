export default function loginRequired(authStore, nextState, replace) {
  if (!authStore.loggedIn) {
    replace({
      pathname: '/login',
      state: { nextPathname: nextState.location.pathname },
    });
  }
}
