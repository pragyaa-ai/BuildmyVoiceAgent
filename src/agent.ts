// SPDX-FileCopyrightText: 2024 LiveKit, Inc.
//
// SPDX-License-Identifier: Apache-2.0
import {
  type JobContext,
  type JobProcess,
  WorkerOptions,
  cli,
  defineAgent,
  llm,
  pipeline,
} from '@livekit/agents';
import { SipClient } from 'livekit-server-sdk';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import * as cartesia from '@livekit/agents-plugin-cartesia';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '../.env');
dotenv.config({ path: envPath });

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    const vad = ctx.proc.userData.vad! as silero.VAD;
    const initialContext = new llm.ChatContext().append({
      role: llm.ChatRole.SYSTEM,
      text:
        'You are a voice assistant created by LiveKit. Your interface with users will be voice. ' +
        'You should use short and concise responses, and avoiding usage of unpronounceable ' +
        'punctuation.',
    });

    // Check if this is an outbound call (phone number provided in metadata)
    let phoneNumber: string | null = null;
    try {
      const metadata = JSON.parse(ctx.job.metadata || '{}');
      phoneNumber = metadata.phone_number || null;
    } catch (e) {
      // No metadata or invalid JSON - this is an inbound call
    }

    await ctx.connect();

    // Handle outbound calling
    if (phoneNumber) {
      console.log(`Making outbound call to ${phoneNumber}`);
      
      // You'll need to replace 'ST_xxxx' with your actual SIP trunk ID
      // Get this from: lk sip outbound list
      const sipTrunkId = process.env.SIP_TRUNK_ID || 'ST_xxxx';
      
      try {
        const sipClient = new SipClient(
          process.env.LIVEKIT_URL!,
          process.env.LIVEKIT_API_KEY!,
          process.env.LIVEKIT_API_SECRET!
        );

        await sipClient.createSipParticipant(
          sipTrunkId,
          phoneNumber,
          ctx.room.name!,
          {
            participantIdentity: phoneNumber,
          }
        );

        console.log('Outbound call connected successfully');
      } catch (error) {
        console.error('Error creating SIP participant:', error);
        return; // Exit if outbound call fails
      }
    }
    console.log('waiting for participant');
    const participant = await ctx.waitForParticipant();
    console.log(`starting assistant example agent for ${participant.identity}`);

    const fncCtx: llm.FunctionContext = {
      weather: {
        description: 'Get the weather in a location',
        parameters: z.object({
          location: z.string().describe('The location to get the weather for'),
        }),
        execute: async ({ location }) => {
          console.debug(`executing weather function for ${location}`);
          const response = await fetch(`https://wttr.in/${location}?format=%C+%t`);
          if (!response.ok) {
            throw new Error(`Weather API returned status: ${response.status}`);
          }
          const weather = await response.text();
          return `The weather in ${location} right now is ${weather}.`;
        },
      },
    };

    const agent = new pipeline.VoicePipelineAgent(
      vad,
      new deepgram.STT(),
      new openai.LLM(),
      new openai.TTS({
        voice: 'alloy',
      }),
      { chatCtx: initialContext, fncCtx },
    );
    agent.start(ctx.room, participant);

    // Only greet on inbound calls - for outbound, wait for user to speak first
    if (!phoneNumber) {
      await agent.say('Hey, how can I help you today', true);
    }
  },
});

cli.runApp(new WorkerOptions({ 
  agent: fileURLToPath(import.meta.url),
  // Agent name is required for explicit dispatch (telephony integration)
  agentName: 'telephony-voice-agent'
}));
