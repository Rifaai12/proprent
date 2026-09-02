import dotenv from 'dotenv';
import { WhatsAppService } from './src/services/whatsappService.js';

dotenv.config();

const token = process.env.WHATSAPP_ACCESS_TOKEN || '';
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const version = process.env.WHATSAPP_GRAPH_API_VERSION || 'v22.0';

// Optional recipient passed via CLI argument or environment or default test number
const testRecipient = process.argv[2] || process.env.WHATSAPP_TEST_RECIPIENT || '';

async function runDiagnostic() {
  console.log('========================================');
  console.log('META WHATSAPP DIAGNOSTIC');
  console.log('========================================');
  console.log(`Graph API version : ${version}`);
  console.log(`Phone Number ID   : ${phoneId ? phoneId : 'NOT CONFIGURED'}`);
  console.log(`Token configured  : ${token ? 'YES (' + token.slice(0, 6) + '...' + token.slice(-4) + ')' : 'NO'}`);
  console.log(`Recipient         : ${testRecipient || 'None specified (Pass via: node test-meta-whatsapp.js <phone>)'}`);
  console.log(`Endpoint          : https://graph.facebook.com/${version}/${phoneId || '<PHONE_NUMBER_ID>'}/messages`);
  console.log('========================================\n');

  if (!token || !phoneId) {
    console.log('❌ MISSING CREDENTIALS:');
    console.log('  Please set WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID in your environment.');
    console.log('  Example:');
    console.log('    $env:WHATSAPP_ACCESS_TOKEN="EAAG..."');
    console.log('    $env:WHATSAPP_PHONE_NUMBER_ID="109876543210987"');
    console.log('    node test-meta-whatsapp.js 919840392047\n');
    return;
  }

  // STEP 1: Verify Phone Number ID & Token with Meta
  console.log('🔹 STEP 1: Verifying Phone Number ID and Access Token with Meta...');
  const verifyUrl = `https://graph.facebook.com/${version}/${phoneId}?fields=id,display_phone_number,verified_name,quality_rating,code_verification_status`;

  try {
    const vRes = await fetch(verifyUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log(`HTTP STATUS: ${vRes.status}`);
    const vData = await vRes.json();
    console.log('META RESPONSE:');
    console.log(JSON.stringify(vData, null, 2));

    if (!vRes.ok) {
      console.log('\n❌ STEP 1 FAILED: Meta rejected the credentials.');
      console.log(`  Error code: ${vData.error?.code}`);
      console.log(`  Error message: ${vData.error?.message}`);
      console.log(`  Trace ID: ${vData.error?.fbtrace_id}`);
      return;
    }

    console.log('✅ STEP 1 PASSED: Credentials and Phone Number ID are valid on Meta!\n');
  } catch (err) {
    console.log(`❌ STEP 1 NETWORK ERROR: ${err.message}`);
    return;
  }

  if (!testRecipient) {
    console.log('ℹ️ No recipient phone number provided for message dispatch test.');
    console.log('  To test message delivery, run: node test-meta-whatsapp.js <PHONE_NUMBER>');
    return;
  }

  const normalizedTo = WhatsAppService.normalizePhoneNumber(testRecipient);
  console.log(`🔹 STEP 2: Testing Meta Standard 'hello_world' Template to ${normalizedTo}...`);

  const templatePayload = {
    messaging_product: 'whatsapp',
    to: normalizedTo,
    type: 'template',
    template: {
      name: 'hello_world',
      language: {
        code: 'en_US'
      }
    }
  };

  const sendEndpoint = `https://graph.facebook.com/${version}/${phoneId}/messages`;

  try {
    const tRes = await fetch(sendEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(templatePayload)
    });

    console.log(`HTTP STATUS: ${tRes.status}`);
    const tData = await tRes.json();
    console.log('META RESPONSE:');
    console.log(JSON.stringify(tData, null, 2));

    if (!tRes.ok) {
      console.log('\n❌ STEP 2 FAILED: Meta rejected the template message.');
      console.log(`  Error Code: ${tData.error?.code}`);
      console.log(`  Error Subcode: ${tData.error?.error_subcode}`);
      console.log(`  Error Message: ${tData.error?.message}`);
      console.log(`  Trace ID: ${tData.error?.fbtrace_id}`);

      if (tData.error?.code === 131030) {
        console.log('\n💡 HINT (Code 131030): The recipient number is not on your Meta sandbox allowed list.');
        console.log('  Go to developers.facebook.com > WhatsApp > API Setup > Step 1, and add this phone number to the "To" test phone numbers.');
      }
      return;
    }

    const wamid = tData.messages?.[0]?.id;
    console.log(`\n🎉 STEP 2 PASSED: Meta ACCEPTED the hello_world template! WAMID: ${wamid}`);
  } catch (err) {
    console.log(`❌ STEP 2 NETWORK ERROR: ${err.message}`);
    return;
  }

  console.log(`\n🔹 STEP 3: Testing Direct Send Utility Message to ${normalizedTo}...`);
  const utilityPayload = {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: normalizedTo,
    type: 'text',
    text: {
      body: 'Hello! This is a test utility message from PropertyRent.AI via Meta WhatsApp Business Cloud API.'
    }
  };

  try {
    const uRes = await fetch(sendEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(utilityPayload)
    });

    console.log(`HTTP STATUS: ${uRes.status}`);
    const uData = await uRes.json();
    console.log('META RESPONSE:');
    console.log(JSON.stringify(uData, null, 2));

    if (!uRes.ok) {
      console.log('\n⚠️ STEP 3 UTILITY SEND NOTE:');
      console.log(`  Error Code: ${uData.error?.code}`);
      console.log(`  Message: ${uData.error?.message}`);
      if (uData.error?.code === 131047) {
        console.log('  💡 HINT: 24-hour customer window expired. In WhatsApp Business Cloud API, user must first message the business number or you must use an approved template.');
      }
    } else {
      const uWamid = uData.messages?.[0]?.id;
      console.log(`\n🎉 STEP 3 PASSED: Meta ACCEPTED the utility message! WAMID: ${uWamid}`);
    }
  } catch (err) {
    console.log(`❌ STEP 3 NETWORK ERROR: ${err.message}`);
  }

  console.log('\n========================================');
  console.log('DIAGNOSTIC COMPLETED');
  console.log('========================================');
}

runDiagnostic().catch(err => {
  console.error('Fatal diagnostic error:', err);
});
