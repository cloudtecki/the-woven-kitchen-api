'use strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017';
process.env.DB_NAME = 'twk_admin_menu_test';
process.env.JWT_SECRET = 'menu_test_secret_0123456789abcdef';
process.env.JWT_EXPIRES_IN = '1d';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = require('../src/app');
const { config } = require('../src/config');
const { connectDB, disconnectDB } = require('../src/infrastructure/database/mongoose/connection');
const { User } = require('../src/infrastructure/database/models/user.model');
const { Category } = require('../src/infrastructure/database/models/category.model');
const { MenuItem } = require('../src/infrastructure/database/models/menu-item.model');
const { ROLES } = require('../src/shared/constants/roles');

let server;
let baseUrl;
let adminToken;
let customerToken;
let categoryId;

async function api(method, path, { token, body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  return { status: response.status, body: text ? JSON.parse(text) : null };
}

function validPayload(overrides = {}) {
  return {
    name: 'Chicken Dum Biryani',
    category: categoryId,
    foodType: 'Non-Veg',
    description: 'Fragrant basmati layered with spiced chicken.',
    servingSize: '250g',
    ingredients: ['Basmati rice', 'Chicken'],
    variants: [{ label: '500g', price: 249, offerPrice: 199 }],
    status: 'Active',
    isDraft: false,
    nutritionStatus: 'Pending',
    ...overrides,
  };
}

before(async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();

  const passwordHash = await bcrypt.hash('AdminPass123', 10);
  const admin = await User.create({
    name: 'Menu Admin',
    email: 'menu-admin@test.local',
    phone: '9000000101',
    password: passwordHash,
    role: ROLES.ADMIN,
  });
  const customer = await User.create({
    name: 'Menu Customer',
    email: 'menu-cust@test.local',
    phone: '9000000102',
    password: passwordHash,
    role: ROLES.CUSTOMER,
  });
  adminToken = jwt.sign({ userId: admin._id.toString(), role: admin.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  customerToken = jwt.sign({ userId: customer._id.toString(), role: customer.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });

  const category = await Category.create({ name: 'Rice & Biryani' });
  categoryId = category._id.toString();

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
});

test('menu: requires auth', async () => {
  const res = await api('GET', '/api/menu');
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

test('menu: customer cannot create/update/delete -> 403', async () => {
  const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  assert.equal((await api('POST', '/api/menu', { token: customerToken, body: {} })).status, 403);
  assert.equal((await api('PATCH', `/api/menu/${id}`, { token: customerToken, body: {} })).status, 403);
  assert.equal((await api('DELETE', `/api/menu/${id}`, { token: customerToken })).status, 403);
});

test('menu: admin create -> 201 with strict-spec payload', async () => {
  const res = await api('POST', '/api/menu', { token: adminToken, body: validPayload() });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.id);
  assert.equal(res.body.data.name, 'Chicken Dum Biryani');
  assert.equal(res.body.data.status, 'Active');
  assert.equal(res.body.data.isDraft, false);
  assert.equal(res.body.data.variants[0].price, 249);
  assert.equal(res.body.data.category.name, 'Rice & Biryani');
  assert.equal(res.body.data.foodType, 'Non-Veg');
});

test('menu: admin create draft -> isDraft true', async () => {
  const res = await api('POST', '/api/menu', {
    token: adminToken,
    body: validPayload({ name: 'Draft Item', isDraft: true }),
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.isDraft, true);
});

test('menu: validation rejects missing name/category/variants', async () => {
  const noName = await api('POST', '/api/menu', { token: adminToken, body: validPayload({ name: '' }) });
  assert.equal(noName.status, 400);

  const noCategory = await api('POST', '/api/menu', {
    token: adminToken,
    body: validPayload({ category: undefined }),
  });
  assert.equal(noCategory.status, 400);

  const noVariants = await api('POST', '/api/menu', {
    token: adminToken,
    body: validPayload({ variants: [] }),
  });
  assert.equal(noVariants.status, 400);
  assert.ok(noVariants.body.message.toLowerCase().includes('variant'));
});

test('menu: validation rejects unknown category id', async () => {
  const res = await api('POST', '/api/menu', {
    token: adminToken,
    body: validPayload({ category: 'bbbbbbbbbbbbbbbbbbbbbbbb' }),
  });
  assert.equal(res.status, 400);
});

test('menu: food type is validated on create/update and returned by the API', async () => {
  const veg = await api('POST', '/api/menu', {
    token: adminToken,
    body: validPayload({ name: 'Paneer Butter Masala', foodType: 'Veg' }),
  });
  assert.equal(veg.status, 201);
  assert.equal(veg.body.data.foodType, 'Veg');

  const invalid = await api('POST', '/api/menu', {
    token: adminToken,
    body: validPayload({ foodType: 'Salty' }),
  });
  assert.equal(invalid.status, 400);
  assert.ok(invalid.body.message.toLowerCase().includes('food type'));

  const missing = await api('POST', '/api/menu', {
    token: adminToken,
    body: validPayload({ name: 'No Food Type', foodType: undefined }),
  });
  assert.equal(missing.status, 400);

  const id = veg.body.data.id;
  const updated = await api('PATCH', `/api/menu/${id}`, {
    token: adminToken,
    body: { foodType: 'Non-Veg' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.foodType, 'Non-Veg');
});

test('menu: list with pagination + get by id', async () => {
  const list = await api('GET', '/api/menu?page=1&limit=10', { token: adminToken });
  assert.equal(list.status, 200);
  assert.ok(Array.isArray(list.body.data));
  assert.ok(list.body.pagination.total >= 2);
  assert.equal(typeof list.body.pagination.pages, 'number');
  for (const item of list.body.data) {
    assert.ok(['Veg', 'Non-Veg'].includes(item.foodType), 'foodType must be Veg or Non-Veg');
  }

  const id = list.body.data[0].id;
  const single = await api('GET', `/api/menu/${id}`, { token: customerToken });
  assert.equal(single.status, 200);
  assert.equal(single.body.data.id, id);
  assert.ok(['Veg', 'Non-Veg'].includes(single.body.data.foodType));
});

test('menu: list filters (status, isDraft, search)', async () => {
  const byStatus = await api('GET', '/api/menu?status=Active', { token: adminToken });
  assert.equal(byStatus.status, 200);
  for (const item of byStatus.body.data) assert.equal(item.status, 'Active');

  const drafts = await api('GET', '/api/menu?isDraft=true', { token: adminToken });
  assert.equal(drafts.status, 200);
  for (const item of drafts.body.data) assert.equal(item.isDraft, true);

  const search = await api('GET', '/api/menu?search=biryani', { token: adminToken });
  assert.equal(search.status, 200);
  assert.ok(search.body.data.length >= 1);
});

test('menu: update + delete flow', async () => {
  const created = await api('POST', '/api/menu', {
    token: adminToken,
    body: validPayload({ name: 'To Update' }),
  });
  const id = created.body.data.id;

  const updated = await api('PATCH', `/api/menu/${id}`, {
    token: adminToken,
    body: { name: 'Updated Name', status: 'Inactive' },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.data.name, 'Updated Name');
  assert.equal(updated.body.data.status, 'Inactive');

  const deleted = await api('DELETE', `/api/menu/${id}`, { token: adminToken });
  assert.equal(deleted.status, 200);

  const get = await api('GET', `/api/menu/${id}`, { token: adminToken });
  assert.equal(get.status, 404);
});

test('menu: get/update/delete unknown id -> 404, invalid id -> 400', async () => {
  assert.equal((await api('GET', '/api/menu/aaaaaaaaaaaaaaaaaaaaaaaa', { token: adminToken })).status, 404);
  assert.equal((await api('GET', '/api/menu/not-a-valid-id', { token: adminToken })).status, 400);
  assert.equal(
    (await api('PATCH', '/api/menu/aaaaaaaaaaaaaaaaaaaaaaaa', { token: adminToken, body: { name: 'x' } })).status,
    404
  );
  assert.equal((await api('DELETE', '/api/menu/aaaaaaaaaaaaaaaaaaaaaaaa', { token: adminToken })).status, 404);
});

test('menu: image upload requires file, rejects non-image', async () => {
  const created = await api('POST', '/api/menu', {
    token: adminToken,
    body: validPayload({ name: 'Image Item' }),
  });
  const id = created.body.data.id;

  const noFile = await fetch(`${baseUrl}/api/menu/${id}/image`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` },
  });
  assert.equal(noFile.status, 400);

  const form = new FormData();
  form.append('image', new Blob(['not-an-image'], { type: 'text/plain' }), 'test.txt');
  const badType = await fetch(`${baseUrl}/api/menu/${id}/image`, {
    method: 'POST',
    headers: { authorization: `Bearer ${adminToken}` },
    body: form,
  });
  assert.equal(badType.status, 400);

  await MenuItem.findByIdAndDelete(id);
});
