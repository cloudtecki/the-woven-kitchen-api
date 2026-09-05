'use strict';

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = 'mongodb://localhost:27017';
process.env.DB_NAME = 'twk_admin_sprint1_test';
process.env.JWT_SECRET = 'sprint1_test_secret_0123456789';
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
const { ROLES } = require('../src/shared/constants/roles');

let server;
let baseUrl;
let adminUser;
let customerUser;
let adminToken;
let customerToken;

async function createUser(data) {
  const passwordHash = await bcrypt.hash(data.password, 10);
  return User.create({ ...data, password: passwordHash });
}

function signToken(userId, role, expiresIn) {
  return jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: expiresIn || config.jwtExpiresIn });
}

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

  adminUser = await createUser({
    name: 'Test Admin',
    email: 'admin@sprint1.test',
    phone: '9000000001',
    password: 'AdminPass123',
    role: ROLES.ADMIN,
  });
  customerUser = await createUser({
    name: 'Seeded Customer',
    email: 'seedcust@sprint1.test',
    phone: '9000000002',
    password: 'CustomerPass123',
    role: ROLES.CUSTOMER,
  });

  adminToken = signToken(adminUser._id.toString(), adminUser.role);
  customerToken = signToken(customerUser._id.toString(), customerUser.role);

  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://localhost:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
});

function assertNoPassword(value) {
  const keys = Object.keys(value);
  assert.ok(!keys.includes('password'), 'response must not contain password');
  assert.ok(!keys.includes('passwordHash'), 'response must not contain passwordHash');
}

// ---------------------------------------------------------------------------
// Signup
// ---------------------------------------------------------------------------

test('signup: creates a CUSTOMER with required phone', async (t) => {
  const res = await api('POST', '/api/auth/signup', {
    body: { name: 'Alice', email: 'alice@test.local', phone: '9111000001', password: 'StrongPassword123', bio: 'Hi' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.role, ROLES.CUSTOMER);
  assert.equal(res.body.data.phone, '9111000001');
  assert.ok(res.body.data.id);
  assert.equal(res.body.data.email, 'alice@test.local');
  assertNoPassword(res.body.data);

  await t.test('password is stored hashed', async () => {
    const raw = await User.findById(res.body.data.id).select('+password').lean();
    assert.ok(raw);
    assert.notEqual(raw.password, 'StrongPassword123');
    assert.ok(await bcrypt.compare('StrongPassword123', raw.password));
    assert.equal(raw.role, ROLES.CUSTOMER);
  });
});

test('signup: rejects missing phone', async () => {
  const res = await api('POST', '/api/auth/signup', {
    body: { name: 'Bob', email: 'bob@test.local', password: 'StrongPassword123' },
  });
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.ok(res.body.message.includes('Phone number is required'));
});

test('signup: rejects empty phone', async () => {
  const res = await api('POST', '/api/auth/signup', {
    body: { name: 'Bob', email: 'bob2@test.local', phone: '', password: 'StrongPassword123' },
  });
  assert.equal(res.status, 400);
});

test('signup: rejects null phone', async () => {
  const res = await api('POST', '/api/auth/signup', {
    body: { name: 'Bob', email: 'bob3@test.local', phone: null, password: 'StrongPassword123' },
  });
  assert.equal(res.status, 400);
});

test('signup: rejects invalid phone format', async () => {
  const res = await api('POST', '/api/auth/signup', {
    body: { name: 'Bob', email: 'bob4@test.local', phone: '1234567890', password: 'StrongPassword123' },
  });
  assert.equal(res.status, 400);
  assert.ok(res.body.message.toLowerCase().includes('10-digit'));
});

test('signup: rejects duplicate email with 409', async () => {
  const res = await api('POST', '/api/auth/signup', {
    body: { name: 'Alice Copy', email: 'alice@test.local', phone: '9111000004', password: 'StrongPassword123' },
  });
  assert.equal(res.status, 409);
  assert.equal(res.body.message, 'Email already registered');
});

test('signup: rejects invalid email', async () => {
  const res = await api('POST', '/api/auth/signup', {
    body: { name: 'Bob', email: 'not-an-email', phone: '9111000005', password: 'StrongPassword123' },
  });
  assert.equal(res.status, 400);
});

test('signup: rejects weak password', async () => {
  const res = await api('POST', '/api/auth/signup', {
    body: { name: 'Bob', email: 'bob5@test.local', phone: '9111000006', password: 'short' },
  });
  assert.equal(res.status, 400);
});

test('signup: ignores role in request and always creates CUSTOMER', async () => {
  const res = await api('POST', '/api/auth/signup', {
    body: { name: 'Hacker', email: 'hacker@test.local', phone: '9111000007', password: 'StrongPassword123', role: 'ADMIN' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.role, ROLES.CUSTOMER);
});

test('signup: normalizes phone with country code', async () => {
  const res = await api('POST', '/api/auth/signup', {
    body: { name: 'Carol', email: 'carol@test.local', phone: '+91 91110 00008', password: 'StrongPassword123' },
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.data.phone, '9111000008');
});

test('signup: rejects duplicate phone', async () => {
  const res = await api('POST', '/api/auth/signup', {
    body: { name: 'Dupe', email: 'dupe@test.local', phone: '9111000001', password: 'StrongPassword123' },
  });
  assert.equal(res.status, 409);
});

// ---------------------------------------------------------------------------
// Login
// ---------------------------------------------------------------------------

test('login: valid customer can login with phone in response', async () => {
  const res = await api('POST', '/api/auth/login', {
    body: { email: 'seedcust@sprint1.test', password: 'CustomerPass123' },
  });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.token);
  assert.equal(res.body.data.user.phone, customerUser.phone);
  assert.equal(res.body.data.user.role, ROLES.CUSTOMER);
  assertNoPassword(res.body.data.user);

  const payload = jwt.decode(res.body.data.token);
  assert.equal(payload.role, ROLES.CUSTOMER);
  assert.equal(payload.userId, customerUser._id.toString());
});

test('login: valid admin can login', async () => {
  const res = await api('POST', '/api/auth/login', {
    body: { email: 'admin@sprint1.test', password: 'AdminPass123' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.user.role, ROLES.ADMIN);
  assert.equal(res.body.data.user.phone, adminUser.phone);
  assertNoPassword(res.body.data.user);
});

test('login: rejects wrong password', async () => {
  const res = await api('POST', '/api/auth/login', {
    body: { email: 'seedcust@sprint1.test', password: 'WrongPassword123' },
  });
  assert.equal(res.status, 401);
});

test('login: rejects unknown email', async () => {
  const res = await api('POST', '/api/auth/login', {
    body: { email: 'ghost@test.local', password: 'Whatever123' },
  });
  assert.equal(res.status, 401);
});

test('login: rejects deactivated user', async () => {
  await createUser({
    name: 'Inactive',
    email: 'inactive@test.local',
    phone: '9111000009',
    password: 'InactivePass123',
    role: ROLES.CUSTOMER,
    isActive: false,
  });
  const res = await api('POST', '/api/auth/login', {
    body: { email: 'inactive@test.local', password: 'InactivePass123' },
  });
  assert.equal(res.status, 401);
});

// ---------------------------------------------------------------------------
// Authentication middleware
// ---------------------------------------------------------------------------

test('auth: missing token -> 401', async () => {
  const res = await api('GET', '/api/users/me');
  assert.equal(res.status, 401);
  assert.equal(res.body.message, 'Authentication required');
});

test('auth: invalid token -> 401', async () => {
  const res = await api('GET', '/api/users/me', { token: 'not-a-real-token' });
  assert.equal(res.status, 401);
});

test('auth: expired token -> 401', async () => {
  const expired = signToken(customerUser._id.toString(), ROLES.CUSTOMER, -10);
  const res = await api('GET', '/api/users/me', { token: expired });
  assert.equal(res.status, 401);
});

test('auth: valid token -> 200', async () => {
  const res = await api('GET', '/api/users/me', { token: customerToken });
  assert.equal(res.status, 200);
});

// ---------------------------------------------------------------------------
// Authorization (role based)
// ---------------------------------------------------------------------------

test('authz: customer accessing admin endpoints -> 403', async () => {
  for (const [method, path] of [
    ['GET', '/api/users'],
    ['GET', `/api/users/${customerUser._id.toString()}`],
    ['PATCH', `/api/users/${customerUser._id.toString()}`],
    ['DELETE', `/api/users/${customerUser._id.toString()}`],
  ]) {
    const res = await api(method, path, { token: customerToken, body: method === 'PATCH' ? { name: 'Hijack' } : undefined });
    assert.equal(res.status, 403, `${method} ${path} should be 403`);
    assert.equal(res.body.message, 'Access denied');
  }
});

test('authz: admin accessing admin endpoint -> allowed', async () => {
  const res = await api('GET', '/api/users', { token: adminToken });
  assert.equal(res.status, 200);
});

test('authz: admin can access customer-level functionality (own profile)', async () => {
  const res = await api('GET', '/api/users/me', { token: adminToken });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.role, ROLES.ADMIN);
  assert.equal(res.body.data.phone, adminUser.phone);
  assertNoPassword(res.body.data);
});

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

test('profile: customer can view own profile', async () => {
  const res = await api('GET', '/api/users/me', { token: customerToken });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.id, customerUser._id.toString());
  assert.equal(res.body.data.phone, customerUser.phone);
  assert.equal(res.body.data.email, customerUser.email);
  assertNoPassword(res.body.data);
});

test('profile: customer can update own name/bio/phone', async () => {
  const res = await api('PATCH', '/api/users/me', {
    token: customerToken,
    body: { name: 'Updated Name', bio: 'Updated bio', phone: '9111000010' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.name, 'Updated Name');
  assert.equal(res.body.data.bio, 'Updated bio');
  assert.equal(res.body.data.phone, '9111000010');
  assertNoPassword(res.body.data);

  adminToken = signToken(adminUser._id.toString(), adminUser.role);
});

test('profile: customer cannot remove phone (null)', async () => {
  const res = await api('PATCH', '/api/users/me', {
    token: customerToken,
    body: { phone: null },
  });
  assert.equal(res.status, 400);
});

test('profile: customer cannot set phone to empty string', async () => {
  const res = await api('PATCH', '/api/users/me', {
    token: customerToken,
    body: { phone: '' },
  });
  assert.equal(res.status, 400);
});

test('profile: customer cannot set invalid phone', async () => {
  const res = await api('PATCH', '/api/users/me', {
    token: customerToken,
    body: { phone: '12345' },
  });
  assert.equal(res.status, 400);
});

test('profile: customer cannot change own role', async () => {
  const res = await api('PATCH', '/api/users/me', {
    token: customerToken,
    body: { role: 'ADMIN' },
  });
  assert.equal(res.status, 400);
});

test('profile: customer cannot use an id to update someone else', async () => {
  const victim = await api('POST', '/api/auth/signup', {
    body: { name: 'Victim', email: 'victim@test.local', phone: '9111000011', password: 'StrongPassword123' },
  });
  const res = await api('PATCH', `/api/users/${victim.body.data.id}`, {
    token: customerToken,
    body: { name: 'Hijacked' },
  });
  assert.equal(res.status, 403);
});

test('profile: customer can change password', async (t) => {
  const me = await api('GET', '/api/users/me', { token: customerToken });
  assert.equal(me.status, 200);
  const email = me.body.data.email;

  await t.test('wrong current password -> 401', async () => {
    const res = await api('PATCH', '/api/auth/change-password', {
      token: customerToken,
      body: { currentPassword: 'Wrong12345', newPassword: 'NewPassword123' },
    });
    assert.equal(res.status, 401);
  });

  await t.test('correct flow -> 200 and old password stops working', async () => {
    const res = await api('PATCH', '/api/auth/change-password', {
      token: customerToken,
      body: { currentPassword: 'CustomerPass123', newPassword: 'NewCustomerPass123' },
    });
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    const oldLogin = await api('POST', '/api/auth/login', { body: { email, password: 'CustomerPass123' } });
    assert.equal(oldLogin.status, 401);

    const newLogin = await api('POST', '/api/auth/login', { body: { email, password: 'NewCustomerPass123' } });
    assert.equal(newLogin.status, 200);
    assertNoPassword(newLogin.body.data.user);
  });
});

// ---------------------------------------------------------------------------
// Admin user management
// ---------------------------------------------------------------------------

test('admin: list users with pagination', async () => {
  const res = await api('GET', '/api/users?page=1&limit=10', { token: adminToken });
  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.pagination.total >= 5);
  for (const user of res.body.data) assertNoPassword(user);
});

test('admin: list users filtered by role', async () => {
  const res = await api('GET', '/api/users?role=CUSTOMER', { token: adminToken });
  assert.equal(res.status, 200);
  assert.ok(res.body.data.length > 0);
  for (const user of res.body.data) assert.equal(user.role, ROLES.CUSTOMER);
});

test('admin: get user by id', async () => {
  const res = await api('GET', `/api/users/${customerUser._id.toString()}`, { token: adminToken });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.id, customerUser._id.toString());
  assert.equal(typeof res.body.data.phone, 'string');
  assert.ok(res.body.data.phone.length >= 10, 'phone must be present');
  assertNoPassword(res.body.data);
});

test('admin: get user with invalid id -> 400', async () => {
  const res = await api('GET', '/api/users/not-a-valid-id', { token: adminToken });
  assert.equal(res.status, 400);
});

test('admin: get user with unknown id -> 404', async () => {
  const res = await api('GET', '/api/users/aaaaaaaaaaaaaaaaaaaaaaaa', { token: adminToken });
  assert.equal(res.status, 404);
});

test('admin: deactivate a customer and block their login', async () => {
  const victim = await api('POST', '/api/auth/signup', {
    body: { name: 'Deactivate Me', email: 'deactivate-me@test.local', phone: '9111000012', password: 'StrongPassword123' },
  });
  const id = victim.body.data.id;

  const res = await api('PATCH', `/api/users/${id}`, {
    token: adminToken,
    body: { isActive: false },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.isActive, false);

  const login = await api('POST', '/api/auth/login', {
    body: { email: 'deactivate-me@test.local', password: 'StrongPassword123' },
  });
  assert.equal(login.status, 401);
});

test('admin: cannot save invalid/empty phone for a user', async () => {
  const res = await api('PATCH', `/api/users/${customerUser._id.toString()}`, {
    token: adminToken,
    body: { phone: '' },
  });
  assert.equal(res.status, 400);

  const res2 = await api('PATCH', `/api/users/${customerUser._id.toString()}`, {
    token: adminToken,
    body: { phone: null },
  });
  assert.equal(res2.status, 400);
});

test('admin: can update phone with valid number', async () => {
  const res = await api('PATCH', `/api/users/${customerUser._id.toString()}`, {
    token: adminToken,
    body: { phone: '9111000013' },
  });
  assert.equal(res.status, 200);
  assert.equal(res.body.data.phone, '9111000013');
});

test('admin: cannot deactivate self', async () => {
  const res = await api('PATCH', `/api/users/${adminUser._id.toString()}`, {
    token: adminToken,
    body: { isActive: false },
  });
  assert.equal(res.status, 403);
});

test('admin: cannot change own role', async () => {
  const res = await api('PATCH', `/api/users/${adminUser._id.toString()}`, {
    token: adminToken,
    body: { role: 'CUSTOMER' },
  });
  assert.equal(res.status, 403);
});

test('admin: cannot delete self', async () => {
  const res = await api('DELETE', `/api/users/${adminUser._id.toString()}`, { token: adminToken });
  assert.equal(res.status, 403);
});

test('admin: can delete a user', async () => {
  const victim = await api('POST', '/api/auth/signup', {
    body: { name: 'Delete Me', email: 'delete-me@test.local', phone: '9111000014', password: 'StrongPassword123' },
  });
  const id = victim.body.data.id;

  const del = await api('DELETE', `/api/users/${id}`, { token: adminToken });
  assert.equal(del.status, 200);

  const get = await api('GET', `/api/users/${id}`, { token: adminToken });
  assert.equal(get.status, 404);
});

// ---------------------------------------------------------------------------
// Menu authorization boundaries
// ---------------------------------------------------------------------------

test('menu: GET /menu/tomorrow requires auth', async () => {
  const res = await api('GET', '/api/menu/tomorrow');
  assert.equal(res.status, 401);
});

test('menu: customer and admin can view tomorrow menu', async () => {
  const customer = await api('GET', '/api/menu/tomorrow', { token: customerToken });
  assert.equal(customer.status, 200);
  assert.deepEqual(customer.body.data, []);

  const admin = await api('GET', '/api/menu/tomorrow', { token: adminToken });
  assert.equal(admin.status, 200);
});

test('menu: customer cannot create/update/delete menu -> 403', async () => {
  const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  assert.equal((await api('POST', '/api/menu', { token: customerToken, body: {} })).status, 403);
  assert.equal((await api('PATCH', `/api/menu/${id}`, { token: customerToken, body: {} })).status, 403);
  assert.equal((await api('DELETE', `/api/menu/${id}`, { token: customerToken })).status, 403);
});

test('menu: admin routes wired (handlers available in later sprint)', async () => {
  const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  assert.equal((await api('POST', '/api/menu', { token: adminToken, body: {} })).status, 501);
  assert.equal((await api('PATCH', `/api/menu/${id}`, { token: adminToken, body: {} })).status, 501);
  assert.equal((await api('DELETE', `/api/menu/${id}`, { token: adminToken })).status, 501);
});

// ---------------------------------------------------------------------------
// Order authorization boundaries
// ---------------------------------------------------------------------------

test('orders: creation requires auth', async () => {
  const res = await api('POST', '/api/orders', { body: {} });
  assert.equal(res.status, 401);
});

test('orders: customer cannot manage orders (modify) and admin routes wired', async () => {
  const id = 'aaaaaaaaaaaaaaaaaaaaaaaa';
  assert.equal((await api('POST', '/api/orders', { token: customerToken, body: {} })).status, 501);
  assert.equal((await api('PATCH', `/api/orders/${id}`, { token: customerToken, body: {} })).status, 403);
  assert.equal((await api('PATCH', `/api/orders/${id}`, { token: adminToken, body: {} })).status, 501);
});

test('orders: customer list returns own-scoped empty list', async () => {
  const res = await api('GET', '/api/orders', { token: customerToken });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data, []);
});

test('orders: admin can list orders (empty until orders sprint)', async () => {
  const res = await api('GET', '/api/orders', { token: adminToken });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data, []);
});

test('orders: specific order not found (order model is a later sprint)', async () => {
  const get = await api('GET', '/api/orders/aaaaaaaaaaaaaaaaaaaaaaaa', { token: customerToken });
  assert.equal(get.status, 404);
  const adminGet = await api('GET', '/api/orders/aaaaaaaaaaaaaaaaaaaaaaaa', { token: adminToken });
  assert.equal(adminGet.status, 404);
});

// ---------------------------------------------------------------------------
// Error/response consistency
// ---------------------------------------------------------------------------

test('errors use the standard response shape', async () => {
  const res = await api('GET', '/api/users/me');
  assert.equal(res.body.success, false);
  assert.equal(typeof res.body.message, 'string');
  assert.equal(typeof res.body.code, 'string');
});