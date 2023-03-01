
export const environment = {
  production: false,
  atmID: (window as any)["env"]["atmID"] || "2",
  endpoint: (window as any)["env"]["apiUrl"] || "http://localhost",
};
