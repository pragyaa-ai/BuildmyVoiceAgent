// Test outbound calling via your agent
const { JobRequest } = require('@livekit/agents');

async function testOutboundCall() {
  // This simulates how your agent would be called with phone number metadata
  const jobRequest = {
    room: {
      name: 'outbound-test-' + Date.now()
    },
    // Phone number in metadata triggers outbound calling logic
    metadata: JSON.stringify({
      phone_number: '+1234567890'  // Replace with your test number
    })
  };
  
  console.log('Testing outbound call with metadata:', jobRequest.metadata);
  console.log('Your agent will attempt to call:', '+1234567890');
  console.log('Change the phone number in this file and run: node test-outbound.js');
}

testOutboundCall();
