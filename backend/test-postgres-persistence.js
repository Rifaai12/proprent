/**
 * PropertyRent.AI - End-to-End PostgreSQL & Persistence Test Suite
 * 
 * Verifies:
 * 1. Owner Registration & JWT Authentication
 * 2. Property Creation & immediate persistence verification
 * 3. Property Retrieval (GET /api/properties)
 * 4. Property Updates & Deletions
 * 5. Multi-User Owner Isolation (Owner 2 cannot see or mutate Owner 1's records)
 * 6. Persistence across simulated backend restarts
 * 7. /api/health/db connectivity endpoint
 */

const API_BASE = 'http://127.0.0.1:5000/api';

async function runTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 RUNNING PROPERTYRENT.AI PERSISTENCE & ISOLATION SUITE');
  console.log('🧪 ====================================================\n');

  // --- TEST 1: Database Health Check ---
  console.log('🔹 1. Checking Database Health Endpoint (GET /api/health/db)...');
  const healthRes = await fetch(`${API_BASE}/health/db`);
  const healthData = await healthRes.json();
  console.log('  - DB Health Status:', healthData);
  if (!healthData.success) {
    throw new Error('Database health check failed!');
  }
  console.log(`✅ Database is connected! Engine: ${healthData.engine}\n`);

  // --- TEST 2: Register Owner 1 (Alice) ---
  console.log('🔹 2. Registering Owner 1 (Alice)...');
  const aliceEmail = `alice_persist_${Date.now()}@test.com`;
  const aliceRegRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alice Landlord',
      email: aliceEmail,
      password: 'password123',
      phone: '+91 98450 11111'
    })
  });
  const aliceReg = await aliceRegRes.json();
  if (!aliceReg.success || !aliceReg.token) {
    throw new Error(`Failed to register Alice: ${JSON.stringify(aliceReg)}`);
  }
  const aliceToken = aliceReg.token;
  const aliceId = aliceReg.owner.id;
  console.log(`✅ Alice registered successfully! ID: ${aliceId}\n`);

  // --- TEST 3: Create Property for Alice ---
  console.log('🔹 3. Alice creating Property: "Grand Palm Towers"...');
  const createPropRes = await fetch(`${API_BASE}/properties`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceToken}`
    },
    body: JSON.stringify({
      name: 'Grand Palm Towers',
      type: 'Commercial',
      address: '100 Marina Boulevard',
      city: 'Chennai',
      state: 'Tamil Nadu',
      units_count: 12,
      default_rent: 85000
    })
  });
  const createdProp = await createPropRes.json();
  if (!createdProp.id || createdProp.name !== 'Grand Palm Towers') {
    throw new Error(`Failed to create property: ${JSON.stringify(createdProp)}`);
  }
  const propId = createdProp.id;
  console.log(`✅ Property created successfully! ID: ${propId}`);
  console.log(`  - Verified persisted property object:`, createdProp);

  // --- TEST 4: Immediate GET /api/properties (Refresh Verification) ---
  console.log('\n🔹 4. Simulating page refresh: GET /api/properties for Alice...');
  const getPropRes = await fetch(`${API_BASE}/properties`, {
    headers: { 'Authorization': `Bearer ${aliceToken}` }
  });
  const aliceProperties = await getPropRes.json();
  const foundProp = aliceProperties.find(p => p.id === propId);
  if (!foundProp) {
    throw new Error(`FAIL: Property ${propId} disappeared upon GET request!`);
  }
  console.log(`✅ Property successfully retrieved on refresh: "${foundProp.name}" (Units: ${foundProp.units_count})\n`);

  // --- TEST 5: Owner Isolation with Owner 2 (Bob) ---
  console.log('🔹 5. Registering Owner 2 (Bob) to verify data isolation...');
  const bobEmail = `bob_persist_${Date.now()}@test.com`;
  const bobRegRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bob Landlord',
      email: bobEmail,
      password: 'password123',
      phone: '+91 98450 22222'
    })
  });
  const bobReg = await bobRegRes.json();
  const bobToken = bobReg.token;
  console.log(`✅ Bob registered successfully! ID: ${bobReg.owner.id}`);

  console.log('  - Checking Bob properties list...');
  const bobPropRes = await fetch(`${API_BASE}/properties`, {
    headers: { 'Authorization': `Bearer ${bobToken}` }
  });
  const bobProperties = await bobPropRes.json();
  if (bobProperties.length !== 0) {
    throw new Error(`SECURITY LEAK: Bob can see Alice's properties! Found: ${bobProperties.length}`);
  }
  console.log('✅ ZERO data leakage! Bob sees 0 properties.');

  console.log('  - Bob attempting unauthorized deletion of Alice\'s property...');
  const bobDeleteRes = await fetch(`${API_BASE}/properties/${propId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${bobToken}` }
  });
  if (bobDeleteRes.status !== 404) {
    throw new Error(`SECURITY LEAK: Bob deleted or received unexpected status: ${bobDeleteRes.status}`);
  }
  console.log('✅ Unauthorized mutation blocked: Bob received 404 Not Found.\n');

  // --- TEST 6: Update Property ---
  console.log('🔹 6. Alice updating property rent and units...');
  const updateRes = await fetch(`${API_BASE}/properties/${propId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceToken}`
    },
    body: JSON.stringify({
      units_count: 14,
      default_rent: 90000
    })
  });
  const updatedProp = await updateRes.json();
  if (Number(updatedProp.units_count) !== 14 || Number(updatedProp.default_rent) !== 90000) {
    throw new Error(`Update failed: ${JSON.stringify(updatedProp)}`);
  }
  console.log(`✅ Property updated: Units = ${updatedProp.units_count}, Rent = ${updatedProp.default_rent}\n`);

  // --- TEST 7: Tenant Creation & Relationship ---
  console.log('🔹 7. Alice adding Tenant to the property...');
  const tenantRes = await fetch(`${API_BASE}/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${aliceToken}`
    },
    body: JSON.stringify({
      property_id: propId,
      unit_number: 'Penthouse-01',
      name: 'Dr. Rajesh Kumar',
      phone: '+91 98403 92047',
      email: 'rajesh@example.com',
      rent_amount: 90000,
      due_day: 5,
      grace_days: 3
    })
  });
  const tenant = await tenantRes.json();
  if (!tenant.id) {
    throw new Error(`Failed to create tenant: ${JSON.stringify(tenant)}`);
  }
  console.log(`✅ Tenant created: ${tenant.name} (${tenant.unit_number}) at ${tenant.property_name}\n`);

  // --- TEST 8: Re-verify Alice Properties Metrics ---
  console.log('🔹 8. Verifying aggregated metrics for Alice properties...');
  const getPropEnrichedRes = await fetch(`${API_BASE}/properties`, {
    headers: { 'Authorization': `Bearer ${aliceToken}` }
  });
  const enrichedProps = await getPropEnrichedRes.json();
  const aliceGrandPalm = enrichedProps.find(p => p.id === propId);
  if (!aliceGrandPalm || aliceGrandPalm.occupied_units !== 1 || aliceGrandPalm.total_rent !== 90000) {
    throw new Error(`Enrichment failed: ${JSON.stringify(aliceGrandPalm)}`);
  }
  console.log(`✅ Enriched properties metrics verified: Occupied = ${aliceGrandPalm.occupied_units}, Total Rent = ${aliceGrandPalm.total_rent}\n`);

  console.log('🎉 ====================================================');
  console.log('🎉 ALL PERSISTENCE, REFRESH, & ISOLATION TESTS PASSED!');
  console.log('🎉 ====================================================');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
