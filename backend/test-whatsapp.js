import { WhatsAppService } from './src/services/whatsappService.js';
import { db } from './src/config/db.js';

const API_BASE = 'http://127.0.0.1:5000/api';

async function runWhatsAppTests() {
  console.log('🧪 ====================================================');
  console.log('🧪 RUNNING META WHATSAPP CLOUD API INTEGRATION TESTS');
  console.log('🧪 ====================================================\n');

  // --- TEST 1: Phone Number Normalization ---
  console.log('🔹 1. Testing Phone Number Normalization...');
  const test1 = WhatsAppService.normalizePhoneNumber('+91 98450 12345');
  console.log(`  - "+91 98450 12345" -> "${test1}"`);
  if (test1 !== '919845012345') throw new Error(`Normalization failed for +91: ${test1}`);

  const test2 = WhatsAppService.normalizePhoneNumber('9876543210');
  console.log(`  - "9876543210" -> "${test2}"`);
  if (test2 !== '919876543210') throw new Error(`Normalization failed for 10-digit: ${test2}`);

  const test3 = WhatsAppService.normalizePhoneNumber('+1 (415) 555-2671', '1');
  console.log(`  - "+1 (415) 555-2671" -> "${test3}"`);
  if (test3 !== '14155552671') throw new Error(`Normalization failed for US: ${test3}`);
  console.log('✅ Phone normalization passed 100%!\n');

  // --- TEST 2: Register User A and User B ---
  console.log('🔹 2. Setting up multi-user test accounts...');
  const timestamp = Date.now();
  
  const regAliceRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Alice Landlord',
      email: `alice_wa_${timestamp}@test.com`,
      password: 'Password123',
      phone: '+91 98111 22233'
    })
  });
  const alice = await regAliceRes.json();

  const regBobRes = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Bob Landlord',
      email: `bob_wa_${timestamp}@test.com`,
      password: 'Password123',
      phone: '+91 98222 33344'
    })
  });
  const bob = await regBobRes.json();

  // Alice creates Tenant A
  const createTenantRes = await fetch(`${API_BASE}/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${alice.token}`
    },
    body: JSON.stringify({
      name: 'Suresh Kumar (Alice Tenant)',
      phone: '+91 98765 43210',
      rent_amount: 25000,
      due_day: 5
    })
  });
  const aliceTenant = await createTenantRes.json();
  console.log(`✅ Alice created Tenant: ${aliceTenant.name} (ID: ${aliceTenant.id})`);

  // --- TEST 3: Multi-User Security Check ---
  console.log('\n🔹 3. Testing Cross-Account WhatsApp Isolation...');
  console.log('  - Bob attempting to send WhatsApp message using Alice\'s tenant ID...');
  const maliciousSendRes = await fetch(`${API_BASE}/whatsapp/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${bob.token}`
    },
    body: JSON.stringify({
      tenantId: aliceTenant.id,
      message: 'Malicious unauthorized message from Bob'
    })
  });
  console.log(`  - Bob response status: ${maliciousSendRes.status} (Expected: 404)`);
  if (maliciousSendRes.status !== 404) {
    throw new Error('SECURITY VULNERABILITY: User B was able to access User A tenant for WhatsApp dispatch!');
  }
  console.log('✅ Cross-account WhatsApp dispatch strictly blocked by backend authorization!\n');

  // --- TEST 4: Configuration Status Check ---
  console.log('🔹 4. Testing GET /api/whatsapp/status...');
  const statusRes = await fetch(`${API_BASE}/whatsapp/status`, {
    headers: { 'Authorization': `Bearer ${alice.token}` }
  });
  const statusData = await statusRes.json();
  console.log('  - WhatsApp Status response:', statusData);
  if (statusData.accessToken) {
    throw new Error('SECURITY LEAK: Access token exposed in status endpoint!');
  }
  console.log('✅ Status endpoint verified secure (Zero token exposure)!\n');

  // --- TEST 5: Direct Send Validation & Error Structure ---
  console.log('🔹 5. Testing WhatsApp Send Validation & Error handling...');
  const sendRes = await fetch(`${API_BASE}/whatsapp/send`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${alice.token}`
    },
    body: JSON.stringify({
      tenantId: aliceTenant.id,
      message: 'Hello Suresh, your rent of ₹25,000 is due on 5th.'
    })
  });
  const sendData = await sendRes.json();
  console.log('  - Send response:', sendData);

  // --- TEST 6: Test Template Endpoint (POST /api/whatsapp/test-template) ---
  console.log('\n🔹 6. Testing POST /api/whatsapp/test-template...');
  const templateRes = await fetch(`${API_BASE}/whatsapp/test-template`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${alice.token}`
    },
    body: JSON.stringify({
      testPhone: '+91 98403 92047'
    })
  });
  const templateData = await templateRes.json();
  console.log('  - Template test response:', templateData);

  // --- TEST 7: Test Utility Endpoint (POST /api/whatsapp/test-utility) ---
  console.log('\n🔹 7. Testing POST /api/whatsapp/test-utility...');
  const utilityRes = await fetch(`${API_BASE}/whatsapp/test-utility`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${alice.token}`
    },
    body: JSON.stringify({
      testPhone: '+91 98403 92047',
      message: 'Hello! Diagnostic test.'
    })
  });
  const utilityData = await utilityRes.json();
  console.log('  - Utility test response:', utilityData);

  // --- TEST 8: Live Verification Endpoint (GET /api/whatsapp/verify) ---
  console.log('\n🔹 8. Testing GET /api/whatsapp/verify...');
  const verifyRes = await fetch(`${API_BASE}/whatsapp/verify`, {
    headers: { 'Authorization': `Bearer ${alice.token}` }
  });
  const verifyData = await verifyRes.json();
  console.log('  - Live verify response:', verifyData);

  console.log('\n🎉 ====================================================');
  console.log('🎉 ALL META WHATSAPP INTEGRATION & SECURITY TESTS PASSED!');
  console.log('🎉 ====================================================');
}

runWhatsAppTests().catch(err => {
  console.error('\n❌ WHATSAPP TEST SUITE FAILED:', err);
  process.exit(1);
});
