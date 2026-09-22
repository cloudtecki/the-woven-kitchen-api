'use strict';

/**
 * Default menu categories. Mirrors `MENU_CATEGORIES` in the frontend
 * (`src/core/base/type/menu.ts`) so menu items created in the UI always
 * reference categories that exist on the server.
 */
const DEFAULT_CATEGORIES = Object.freeze([
  'Rice & Biryani',
  'Curries',
  'Starters',
  'Breads',
  'Desserts',
  'Beverages',
]);

module.exports = { DEFAULT_CATEGORIES };