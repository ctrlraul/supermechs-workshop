export const isInProduction: boolean = !(/\d+\.\d+\.\d+\.\d+|localhost/).test(window.location.hostname);
