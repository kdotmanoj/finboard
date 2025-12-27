export const getNestedValue = (obj, path) => {
  if (!obj || !path) return undefined;
  return path.split("-->").reduce((acc, part) => {
    return acc && acc[part] !== undefined ? acc[part] : null;
  }, obj);
};

export const flattenObject = (obj, prefix = "") => {
  return Object.keys(obj).reduce((acc, key) => {
    const path = prefix ? `${prefix}-->${key}` : key;
    if (typeof obj[key] === "object" && obj[key] !== null) {
      return { ...acc, ...flattenObject(obj[key], path) };
    } else {
      return { ...acc, [path]: obj[key] };
    }
  }, {});
};
