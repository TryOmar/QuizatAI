// UUID/ID generation utilities

/**
 * Generates a UUID v4 compatible string
 * @returns {string} A UUID v4 string in format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function generateUUID() {
  const buffer = new Uint8Array(16);
  crypto.getRandomValues(buffer);
  const hex = Array.from(buffer)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(
    12,
    16
  )}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/**
 * Generates a user ID using the same format as UUID
 * @returns {string} A user ID string in UUID format
 */
export function generateUserId() {
  return generateUUID();
}

/**
 * Generates a quiz ID using the same format as UUID
 * @returns {string} A quiz ID string in UUID format
 */
export function generateQuizId() {
  return generateUUID();
}

/**
 * Validates if a string matches UUID format
 * @param {string} uuid - The string to validate
 * @returns {boolean} True if string matches UUID format
 */
export function isValidUUID(uuid) {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
