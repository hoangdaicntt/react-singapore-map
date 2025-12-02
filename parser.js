const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'map.svg');
const outputPath = path.join(__dirname, 'map.json');

if (!fs.existsSync(svgPath)) {
  console.error(`Cannot find map.svg at ${svgPath}`);
  process.exit(1);
}

const svgContent = fs.readFileSync(svgPath, 'utf8');

const coerceValue = (value) => {
  const numeric = Number(value);
  return Number.isNaN(numeric) ? value : numeric;
};

const parseAttributes = (rawAttributes) => {
  const attributes = {};
  const attributeRegex = /([\w:-]+)\s*=\s*"([^"]*)"/g;
  let match;

  while ((match = attributeRegex.exec(rawAttributes)) !== null) {
    const [, key, value] = match;
    attributes[key] = coerceValue(value);
  }

  return attributes;
};

const readRootAttribute = (name) => {
  const matcher = new RegExp(`${name}="([^"]+)"`);
  const match = matcher.exec(svgContent);

  return match ? coerceValue(match[1]) : undefined;
};

const parseElements = (content) => {
  const elements = [];
  const elementRegex = /<(path|circle)\s+([\s\S]*?)\/>/g;
  let match;

  while ((match = elementRegex.exec(content)) !== null) {
    const [, type, rawAttributes] = match;
    const attributes = parseAttributes(rawAttributes);

    elements.push({
      type,
      ...attributes,
    });
  }

  return elements;
};

const groups = [];
const groupRegex = /<g\s+([^>]*?id="([^"]+)"[^>]*)>([\s\S]*?)<\/g>/g;
let groupMatch;

while ((groupMatch = groupRegex.exec(svgContent)) !== null) {
  const [, rawAttributes, id, content] = groupMatch;
  const attributes = parseAttributes(rawAttributes);
  delete attributes.id;

  groups.push({
    id,
    attributes,
    elements: parseElements(content),
  });
}

const result = {
  width: readRootAttribute('width'),
  height: readRootAttribute('height'),
  viewBox: readRootAttribute('viewBox'),
  groups,
};

fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
console.log(
  `Created map.json with ${groups.length} groups and ${groups.reduce(
    (total, group) => total + group.elements.length,
    0,
  )} elements.`,
);
