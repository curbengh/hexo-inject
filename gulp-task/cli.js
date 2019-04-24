const adapteType = (orig, v) => {
  if (orig == null || typeof v !== 'string') {
    return v;
  }
  const t = typeof orig;
  switch (t) {
    case 'string':
      return v;
    case 'number':
      return parseFloat(v);
    case 'boolean':
      return v.toLowerCase() === 'true';
    case 'object':
      if (Array.isArray(orig)) {
        return v.split(',').map(v => v.trim());
      }
  }
  throw new Error(`Incompatable type: ${t} and string`);
};

const setValue = (o, k, v) => {
  const keys = k.split('.');
  const _k = keys.pop();
  let p = o;
  while (p && keys.length > 0) {
    p = p[keys.shift()];
  }
  if (p == null) return;

  try {
    return p[_k] = adapteType(p[_k], v);
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
