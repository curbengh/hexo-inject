/**
 * @param {any[]|string|number|boolean} orig 
 * @param {string} value 
 */
const adapteType = (orig, value) => {
  if (orig == null || typeof value !== 'string') {
    return value;
  }
  if (Array.isArray(orig)) {
    return value.split(',').map(v => v.trim());
  }
  const type = typeof orig;
  switch (type) {
    case 'string':
      return value;
    case 'number':
      return parseFloat(value);
    case 'boolean':
      return value.toLowerCase() === 'true';
    default:
      throw new Error(`Incompatable type: ${type} and string`);
  }
};

/**
 * @param {*} orig 
 * @param {string} key 
 * @param {*} value 
 */
const setValue = (orig, key, value) => {
  if (orig == null) return;

  const keys = key.split('.');
  const lastKey = keys.pop();
  const { length } = keys;

  let pointer = orig;
  for (let i = 0; i < length; i++) {
    pointer = pointer[keys[i]];
    if (pointer == null) return;
  }

  try {
    return pointer[lastKey] = adapteType(pointer[lastKey], value);
  } catch (error) {
    console.log(`Failed to set value. Reason: ${error}.`);
  }
};

module.exports = (profile = "default") => {
  const cfg = config[`cli:${profile}`];
  const mappings = cfg.opts.mapping;
  const globalMapping = mappings.GLOBAL || {};

  for (const key in mappings) {
    const mapping = mappings[key];
    // Get config to be mapped
    const target = config[key];
    // No config
    if (target == null) {
      continue;
    }
    for (const field in mapping) {
      const arg = mapping[field];
      const value = heap.cli.opts[arg];
      // No cli override
      if (value == null) {
        continue;
      }
      // Set value
      console.log(`Map ${key}.${field} -> --${arg}=${value}`);
      setValue(target, field, value);
    }
  }

  const results = [];
  for (const field in globalMapping) {
    const arg = globalMapping[field];
    const value = heap.cli.opts[arg];

    // No cli override
    if (value == null) {
      continue;
    }

    const results1 = [];
    for (const key in config) {
      const target = config[key];
      console.log(`Map ${key}.${field} -> --${arg}=${value}`);
      results1.push(setValue(target, field, value));
    }
    results.push(results1);
  }

  return results;
};
