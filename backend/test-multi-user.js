import { db } from './src/config/db.js';

const API_BASE = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 RUNNING PROPERTYRENT.AI MULTI-USER ISOLATION TEST SUITE');
  console.log('🧪 ====================================================\n');

  const timestamp = Date.now();
  const aliceEmail = `alice_${timestamp}@test.com`;
  const bobEmail = `bob_${timestamp}@test.com`;

  // --- TEST 1: Register User A (Alice) ---
  console.log('🔹 1. Registering Account A (Alice)...');
  const regAliceRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alice Johnson',
      email: aliceEmail,
      password: 'AlicePassword123',
      phone: '+91 98111 22233'
    })
  });
  const aliceData = await regAliceRes.json();
  if (!aliceData.token) throw new Error(`Alice registration failed: ${JSON.stringify(aliceData)}`);
  console.log(`✅ Alice registered successfully! Token generated for Owner ID: ${aliceData.owner.id}`);

  // --- TEST 2: Alice creates Property A & Tenant A ---
  console.log('\n🔹 2. Alice creating Property A and Tenant A...');
  const propAliceRes = await fetch(`${API_BASE}/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceData.token}`
    },
    body: JSON.stringify({
      name: 'Alice Green Heights',
      type: 'Apartment',
      units_count: 5,
      default_rent: 30000
    })
  });
  const aliceProp = await propAliceRes.json();
  console.log(`✅ Alice created Property: ${aliceProp.name} (ID: ${aliceProp.id})`);

  const tenantAliceRes = await fetch(`${API_BASE}/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceData.token}`
    },
    body: JSON.stringify({
      property_id: aliceProp.id,
      unit_number: '101',
      name: 'Ravi Kumar (Alice Tenant)',
      phone: '+91 98450 11111',
      rent_amount: 30000,
      due_day: 5
    })
  });
  const aliceTenant = await tenantAliceRes.json();
  console.log(`✅ Alice created Tenant: ${aliceTenant.name} (ID: ${aliceTenant.id})`);

  // --- TEST 3: Register User B (Bob) ---
  console.log('\n🔹 3. Registering Account B (Bob)...');
  const regBobRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bob Smith',
      email: bobEmail,
      password: 'BobPassword123',
      phone: '+91 98222 33344'
    })
  });
  const bobData = await regBobRes.json();
  if (!bobData.token) throw new Error(`Bob registration failed: ${JSON.stringify(bobData)}`);
  console.log(`✅ Bob registered successfully! Token generated for Owner ID: ${bobData.owner.id}`);

  // --- TEST 4: Verify Bob has ZERO access to Alice's data (Empty Account) ---
  console.log('\n🔹 4. Verifying Bob sees ZERO of Alice data (Data Isolation)...');
  const bobPropsRes = await fetch(`${API_BASE}/properties`, {
    headers: { 'Authorization': `Bearer ${bobData.token}` }
  });
  const bobProps = await bobPropsRes.json();
  console.log(`  - Bob Properties count: ${bobProps.length} (Expected: 0)`);
  if (bobProps.length !== 0) throw new Error('DATA LEAK: Bob can see properties!');

  const bobTenantsRes = await fetch(`${API_BASE}/tenants`, {
    headers: { 'Authorization': `Bearer ${bobData.token}` }
  });
  const bobTenants = await bobTenantsRes.json();
  console.log(`  - Bob Tenants count: ${bobTenants.length} (Expected: 0)`);
  if (bobTenants.length !== 0) throw new Error('DATA LEAK: Bob can see tenants!');

  const bobMetricsRes = await fetch(`${API_BASE}/dashboard-metrics`, {
    headers: { 'Authorization': `Bearer ${bobData.token}` }
  });
  const bobMetrics = await bobMetricsRes.json();
  console.log(`  - Bob Total Rent Expected: ${bobMetrics.totalRentExpected} (Expected: 0)`);
  if (bobMetrics.totalRentExpected !== 0) throw new Error('DATA LEAK: Bob metrics polluted!');
  console.log('✅ ZERO Cross-Account Data Leakage verified!');

  // --- TEST 5: Verify Bob CANNOT delete or modify Alice's records ---
  console.log('\n🔹 5. Verifying Bob cannot mutate Alice records...');
  const maliciousDeleteRes = await fetch(`${API_BASE}/properties/${aliceProp.id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${bobData.token}` }
  });
  console.log(`  - Malicious DELETE status: ${maliciousDeleteRes.status} (Expected: 404)`);
  if (maliciousDeleteRes.status !== 404) throw new Error('SECURITY BREACH: Bob could delete Alice property!');
  console.log('✅ Cross-Tenant Mutation Prevention verified!');

  // --- TEST 6: Bob creates his own Property B ---
  console.log('\n🔹 6. Bob creating Property B...');
  const propBobRes = await fetch(`${API_BASE}/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bobData.token}`
    },
    body: JSON.stringify({
      name: 'Bob Ocean Plaza',
      type: 'Commercial',
      units_count: 10,
      default_rent: 75000
    })
  });
  const bobProp = await propBobRes.json();
  console.log(`✅ Bob created Property: ${bobProp.name}`);

  // Re-check Alice view
  const alicePropsCheck = await fetch(`${API_BASE}/properties`, {
    headers: { 'Authorization': `Bearer ${aliceData.token}` }
  });
  const alicePropsList = await alicePropsCheck.json();
  console.log(`  - Alice sees properties: ${alicePropsList.map(p => p.name).join(', ')}`);
  if (alicePropsList.some(p => p.name.includes('Bob'))) throw new Error('DATA LEAK: Alice sees Bob property!');

  // --- TEST 7: Session Verification (/api/auth/me) ---
  console.log('\n🔹 7. Verifying /api/auth/me session resolution...');
  const aliceMeRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${aliceData.token}` }
  });
  const aliceMe = await aliceMeRes.json();
  console.log(`  - Alice /me: ${aliceMe.owner.name} (${aliceMe.owner.email}) - Properties: ${aliceMe.account_stats.propertiesCount}`);

  const bobMeRes = await fetch(`${API_BASE}/auth/me`, {
    headers: { 'Authorization': `Bearer ${bobData.token}` }
  });
  const bobMe = await bobMeRes.json();
  console.log(`  - Bob /me: ${bobMe.owner.name} (${bobMe.owner.email}) - Properties: ${bobMe.account_stats.propertiesCount}`);

  console.log('\n🎉 ====================================================');
  console.log('🎉 ALL MULTI-USER ISOLATION & AUTH TESTS PASSED 100%!');
  console.log('🎉 ====================================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST SUITE FAILED:', err);
  process.exit(1);
});
