const state = { status: 'guest', user: null, accessToken: null };
export const getAuthState = () => state;
export const getAccessToken = () => state.accessToken;
export function setLoading() { state.status = 'loading'; }
export function setAuthenticated(user, accessToken) {
    Object.assign(state, { status: 'authenticated', user, accessToken });
}
export function setGuest() { Object.assign(state, { status: 'guest', user: null, accessToken: null }); }
export const clearAuth = setGuest;
export function setAuth(data) { setAuthenticated(data.user, data.accessToken); }
