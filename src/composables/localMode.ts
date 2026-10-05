const preferenceKey = 'gtt:local-mode';

export function hasChosenLocalMode() {
  return localStorage.getItem(preferenceKey) === 'true';
}

export function chooseLocalMode() {
  localStorage.setItem(preferenceKey, 'true');
}
