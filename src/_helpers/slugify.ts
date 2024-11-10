import slugify from 'slugify';

function _vietnameseSlugify(text) {
  return text
    .toString()
    .normalize('NFD') // Decompose accents
    .replace(/[\u0300-\u036f]/g, '') // Remove accents and diacritics
    .replace(/đ/g, 'd') // Handle Vietnamese-specific characters
    .replace(/Đ/g, 'd') // Handle uppercase 'Đ'
    .toLowerCase() // Convert to lowercase
    .trim() // Remove whitespace from both sides of the string
    .replace(/[^a-z0-9 -]/g, '') // Remove all non-alphanumeric characters except spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single hyphen
}

export function vietnameseSlugify(text: string) {
  return slugify(_vietnameseSlugify(text));
}
