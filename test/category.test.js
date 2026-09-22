'use strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017';
process.env.DB_NAME = 'twk_admin_category_test';
process.env.JWT_SECRET = 'category_test_secret_0123456789abcdef';
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
const { ROLES } = require('../src/shared/constants/roles');
const { DEFAULT_CATEGORIES } = require('../src/shared/constants/categories');

let server;
let baseUrl;
let adminToken;
let customerToken;

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

before(async () => {
  await connectDB();
  await mongoose.connection.dropDatabase();

  const passwordHash = await bcrypt.hash('AdminPass123', 10);
  const admin = await User.create({
    name: 'Category Admin',
    email: 'category-admin@test.local',
    phone: '9000000201',
    password: passwordHash,
    role: ROLES.ADMIN,
  });
  const customer = await User.create({
    name: 'Category Customer',
    email: 'category-cust@test.local',
    phone: '9000000202',
    password: passwordHash,
    role: ROLES.CUSTOMER,
  });
  adminToken = jwt.sign({ userId: admin._id.toString(), role: admin.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
  customerToken = jwt.sign(
    { userId: customer._id.toString(), role: customer.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  await Category.insertMany(DEFAULT_CATEGORIES.map((name) => ({ name })));

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
});

test('categories: requires auth', async () => {
  assert.equal((await api('GET', '/api/categories')).status, 401);
});

test('categories: lists default categories sorted by name (admin + customer)', async () => {
  const res = await api('GET', '/api/categories', { token: adminToken });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.equal(res.body.data.length, DEFAULT_CATEGORIES.length);

  const names = res.body.data.map((c) => c.name);
  assert.ok(names.includes('Rice & Biryani'));
  assert.ok(names.includes('Curries'));
  assert.deepEqual(names, [...names].sort());

  for (const category of res.body.data) {
    assert.match(category.id, /^[0-9a-fA-F]{24}$/);
    assert.ok(category.name);
    assert.equal(Object.keys(category).length, 2);
  }

  const asCustomer = await api('GET', '/api/categories', { token: customerToken });
  assert.equal(asCustomer.status, 200);
});

test('categories: get by id, unknown id -> 404, invalid id -> 400', async () => {
  const list = await api('GET', '/api/categories', { token: adminToken });
  const category = list.body.data[0];

  const single = await api('GET', `/api/categories/${category.id}`, { token: adminToken });
  assert.equal(single.status, 200);
  assert.equal(single.body.data.id, category.id);
  assert.equal(single.body.data.name, category.name);

  assert.equal(
    (await api('GET', '/api/categories/aaaaaaaaaaaaaaaaaaaaaaaa', { token: adminToken })).status,
    404
  );
  assert.equal(
    (await api('GET', '/api/categories/not-a-valid-id', { token: adminToken })).status,
    400
  );
});

test('categories: customer cannot create -> 403', async () => {
  assert.equal(
    (await api('POST', '/api/categories', { token: customerToken, body: { name: 'Noodles' } }))
      .status,
    403
  );
});

test('categories: admin create -> 201, duplicate -> 409, invalid body -> 400', async () => {
  const created = await api('POST', '/api/categories', {
    token: adminToken,
    body: { name: '  Noodles  ' },
  });
  assert.equal(created.status, 201);
  assert.equal(created.body.data.name, 'Noodles');

  const duplicate = await api('POST', '/api/categories', {
    token: adminToken,
    body: { name: 'Noodles' },
  });
  assert.equal(duplicate.status, 409);

  const empty = await api('POST', '/api/categories', { token: adminToken, body: { name: ' ' } });
  assert.equal(empty.status, 400);
});