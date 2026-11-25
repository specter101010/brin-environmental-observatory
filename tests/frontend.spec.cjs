const { test, expect } = require('@playwright/test');
async function mockApi(page) {
  const devices = [{ device_id: 1, nama_alat: 'Stasiun Palembang', mqtt_topic: 'msi/device1', is_active: 1 },
    { device_id: 2, nama_alat: 'Stasiun Riset Kedua', mqtt_topic: 'msi/device2', is_active: 1 }];
  let validSession = false;
  const requests = [];
  await page.route('https://brin-api.unsri-fasilkom.cloud/**', async route => {
    const request = route.request(); const url = new URL(request.url()); const path = url.pathname;
    requests.push({ path, query: url.search, method: request.method() });
    const respond = (body, status = 200) => route.fulfill({ status, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: JSON.stringify(body) });
    if (request.method() === 'OPTIONS') return respond({});
    if (path === '/api/auth/login') {
      if (request.postDataJSON().password !== 'AdminExamplePassword') return respond({ success: false, message: 'Username atau password salah.' }, 401);
      validSession = true;
      return respond({ success: true, data: { token: 'a'.repeat(64), user: { id: 1, username: 'admin', nama: 'Admin Riset' } } });
    }
    if (path === '/api/auth/me') return validSession ? respond({ success: true, data: { id: 1, username: 'admin', nama: 'Admin Riset' } }) : respond({ message: 'Sesi berakhir.' }, 401);
    if (path === '/api/auth/logout') { validSession = false; return respond({ success: true }); }
    if (path.startsWith('/api/admin/devices')) {
      if (!validSession || request.headers().authorization !== `Bearer ${'a'.repeat(64)}`) return respond({ message: 'Login diperlukan.' }, 401);
      if (request.method() === 'POST') { const input = request.postDataJSON(); const device = { device_id: 3, ...input }; devices.push(device); return respond({ success: true, data: device }, 201); }
      if (request.method() === 'PATCH') { Object.assign(devices.find(d => d.device_id === Number(path.split('/').pop())), request.postDataJSON()); return respond({ success: true }); }
      if (request.method() === 'DELETE') { devices.find(d => d.device_id === Number(path.split('/').pop())).is_active = 0; return respond({ success: true }); }
      return respond({ success: true, data: devices });
    }
    if (path === '/api/devices') return respond({ success: true, data: devices.filter(d => d.is_active).map(({ device_id, nama_alat }) => ({ device_id, nama_alat })) });
    if (path === '/api/sensor-data') {
      const device = Number(url.searchParams.get('device_id')); const current = Number(url.searchParams.get('page') || 1); const limit = Number(url.searchParams.get('limit') || 500);
      const rows = Array.from({ length: 620 }, (_, i) => ({ id: String(device * 10000 - i), device_id: device,
        timestamp: new Date(Date.now() - i * 60000).toISOString().replace('T', ' ').replace('Z', ''),
        temperature: device === 1 ? 28.4 : 31.7, pressure_hpa: 1009.2, gas_resistance_kohm: 92.5,
        co_ppm: .7, co2_ppm: 428, nh3_ppm: 0, dust_ppm: 18, wind_speed_ms: 2.4, iaq_category: 'Baik', latitude: -2.98487, longitude: 104.7324 }));
      return respond({ success: true, pagination: { page: current, limit, total: 620, total_pages: Math.ceil(620 / limit) }, data: rows.slice((current - 1) * limit, current * limit) });
    }
    return respond({ message: 'Endpoint tidak ditemukan.' }, 404);
  });
  return { requests };
}

test('public devices, selection, UTC freshness and API history pagination', async ({ page }) => {
  const { requests } = await mockApi(page);
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Stasiun Palembang' })).toBeVisible();
  await expect(page.getByRole('button', { name: /login|masuk/i })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Control panel' })).toHaveCount(0);
  await expect.poll(() => page.locator('.station-card').last().evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  await page.screenshot({ path: 'test-results/dashboard-desktop.png', fullPage: true });
  await page.getByRole('button', { name: /Stasiun Palembang/ }).click();
  await expect(page.getByRole('heading', { name: 'Ringkasan alat.' })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navigasi utama' }).getByRole('button', { name: 'Ringkasan alat' })).toHaveCount(0);
  await expect(page.locator('.connection-bar')).toContainText('Terhubung');
  await expect(page.locator('.sensor-card').filter({ hasText: 'Suhu udara' })).toContainText('28,4');
  await page.locator('.trend svg').hover({ position: { x: 300, y: 80 } });
  await expect(page.locator('.chart-tooltip')).toBeVisible();
  await page.getByRole('button', { name: 'Histori', exact: true }).click();
  await expect(page.locator('.history-load')).toContainText('500 dari 620');
  await page.getByRole('button', { name: 'Muat data lebih lama' }).click();
  await expect(page.locator('.history-load')).toContainText('620 dari 620');
  expect(requests.some(r => r.path === '/api/sensor-data' && r.query.includes('page=2'))).toBeTruthy();
  await page.getByRole('button', { name: 'Berikutnya', exact: true }).click();
  await expect(page.locator('.pagination')).toContainText('13–24');
  await page.getByRole('button', { name: 'Dashboard', exact: true }).click();
  await page.getByRole('button', { name: /Stasiun Riset Kedua/ }).click();
  await expect(page.locator('.sensor-card').filter({ hasText: 'Suhu udara' })).toContainText('31,7');
  expect(errors).toEqual([]);
});

test('manual login, failed credentials, API CRUD, logout and route protection', async ({ page }) => {
  await mockApi(page);
  await page.goto('/admin'); await expect(page).toHaveURL(/\/login$/);
  await expect.poll(() => page.locator('.login-card').evaluate(el => Number(getComputedStyle(el).opacity))).toBe(1);
  await page.screenshot({ path: 'test-results/login-desktop.png', fullPage: true });
  await page.getByLabel('Username', { exact: true }).fill('admin');
  await page.getByLabel('Password', { exact: true }).fill('incorrect');
  await page.getByRole('button', { name: 'Masuk ke ruang admin' }).click();
  await expect(page.getByRole('alert')).toContainText('Username atau password salah.');
  await page.getByLabel('Password', { exact: true }).fill('AdminExamplePassword');
  await page.getByRole('button', { name: 'Masuk ke ruang admin' }).click();
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole('heading', { name: 'Ruang pengelola.' })).toBeVisible();
  await page.getByLabel('Nama alat', { exact: true }).fill('Stasiun Baru');
  await page.getByLabel('Topik MQTT', { exact: true }).fill('msi/device3');
  await page.getByRole('button', { name: 'Tambahkan alat' }).click();
  const row = page.locator('.admin-device-row').filter({ hasText: 'Stasiun Baru' });
  await expect(row).toBeVisible();
  await row.getByRole('button', { name: 'Edit', exact: true }).click();
  await page.getByLabel('Nama alat', { exact: true }).fill('Stasiun Revisi');
  await page.getByRole('button', { name: 'Simpan perubahan' }).click();
  const revised = page.locator('.admin-device-row').filter({ hasText: 'Stasiun Revisi' });
  await expect(revised).toBeVisible();
  await revised.getByRole('button', { name: 'Nonaktifkan', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Nonaktifkan alat' }).click();
  await expect(revised).toContainText('Nonaktif');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.screenshot({ path: 'test-results/admin-desktop.png', fullPage: true });
  await page.getByRole('button', { name: 'Keluar', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/admin'); await expect(page).toHaveURL(/\/login$/);
});

test('mobile layout and reduced motion remain usable', async ({ page }) => {
  await mockApi(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Stasiun Palembang' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: 'test-results/dashboard-mobile.png', fullPage: true });
  await page.goto('/login');
  await expect(page.getByLabel('Username', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await page.screenshot({ path: 'test-results/login-mobile.png', fullPage: true });
});
