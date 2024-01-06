export const query = (o: object) => Object
  .entries(o)
  .map(([key, value]) => `${key}=${value}`)
  .join('&');