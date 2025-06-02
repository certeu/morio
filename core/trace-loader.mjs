// trace-loader.mjs
const importStack = [];

export async function resolve(specifier, context, nextResolve) {
  const resolved = await nextResolve(specifier, context);

  // Track the import chain
  const importer = context.parentURL || 'entry';
  const importing = resolved.url;

  if (importer.indexOf('node_modules') === -1)
    console.log(`${importer} -> ${importing}`)

  // Check for potential cycles
  //if (importStack.includes(importing)) {
  //  console.warn(`🔄 POTENTIAL CYCLE DETECTED: ${importing}`);
  //  console.warn(`Import stack: ${importStack.join(' -> ')}`);
  //}

  importStack.push(importing);

  return resolved;
}

export async function load(url, context, nextLoad) {
  const result = await nextLoad(url, context);
  // Remove from stack when done loading
  const index = importStack.indexOf(url);
  if (index > -1) {
    importStack.splice(index, 1);
  }
  return result;
}
