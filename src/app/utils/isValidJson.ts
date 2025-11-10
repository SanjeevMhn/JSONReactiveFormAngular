export function isValidJson(jsonString: string): boolean {
  if (typeof jsonString !== 'string' || jsonString.trim() === '') {
    return false;
  }
  try {
    JSON.parse(jsonString);
    return true;
  } catch (e) {
    return false;
  }
}
