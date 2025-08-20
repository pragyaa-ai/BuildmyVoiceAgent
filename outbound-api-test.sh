#!/bin/bash

# Load environment variables
source .env.local

# Test outbound call via LiveKit REST API
curl -X POST "${LIVEKIT_URL}/twirp/livekit.SIPService/CreateSIPParticipant" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $(echo -n "${LIVEKIT_API_KEY}:${LIVEKIT_API_SECRET}" | base64)" \
  -d '{
    "sip_trunk_id": "ST_xoNiDzrAWja2",
    "sip_call_to": "+1234567890",
    "room_name": "outbound-api-test",
    "participant_identity": "api-caller"
  }'

echo "
Replace +1234567890 with your test number and run: ./outbound-api-test.sh"

