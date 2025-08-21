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
    // Enhanced VoiceAgent 2.0 configuration
    const metadata = ctx.job.metadata || {};
    let agentConfig;
    
    try {
      const parsedMetadata = typeof metadata === 'string' ? JSON.parse(metadata) : metadata;
      const scenario = parsedMetadata.scenario || 'simpleExample';
      const escalationModel = parsedMetadata.escalationModel || 'gpt-4o-mini';
      
      console.log(`[REALTIME-AGENT-V2] 🚀 Initializing with scenario: ${scenario}`);
      console.log(`[REALTIME-AGENT-V2] 🧠 Using reasoning model: ${escalationModel}`);
      
      if (scenario === 'customerServiceRetail') {
        agentConfig = {
          systemPrompt: 'You are an advanced customer service AI agent with enhanced reasoning capabilities. You represent VoiceAgent 2.0 technology with improved response times and decision-making. Help customers with returns, purchases, and questions. Provide empathetic, professional service and use your enhanced AI capabilities to resolve issues quickly and accurately. Keep responses conversational for voice interaction.',
          greeting: 'Welcome to our next-generation customer service! I\'m an advanced AI assistant here to help you with returns, purchases, or any questions. I can handle complex requests with improved accuracy and speed. How may I help you today?'
        };
      } else {
        agentConfig = {
          systemPrompt: 'You are an advanced AI voice assistant representing VoiceAgent 2.0 technology. You have enhanced capabilities including creative writing, especially haiku poetry. You are optimized for natural voice conversations with faster response times. Offer to write haikus, engage in creative conversations, and showcase your improved AI capabilities. Keep responses conversational and suitable for voice interaction.',
          greeting: 'Hello! I\'m your advanced AI assistant powered by the latest technology. I can help you with various tasks, including writing beautiful poetry. Would you like me to create a haiku for you today?'
        };
      }
    } catch (e) {
      // Fallback to enhanced default
      agentConfig = {
        systemPrompt: 'You are VoiceAgent 2.0, an advanced AI assistant with enhanced capabilities and faster response times. You excel at natural conversation and creative tasks. Your interface with users will be voice, so use short, conversational responses suitable for speaking.',
        greeting: 'Hello! I\'m your advanced AI assistant, VoiceAgent 2.0. I have enhanced capabilities and faster response times. How can I help you today?'
      };
    }

    const initialContext = new llm.ChatContext().append({
      role: llm.ChatRole.SYSTEM,
      text: agentConfig.systemPrompt,
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

    // Enhanced greeting for inbound calls - VoiceAgent 2.0
    if (!phoneNumber) {
      console.log('[REALTIME-AGENT-V2] 🎙️ Sending enhanced greeting...');
      await agent.say(agentConfig.greeting, true);
      console.log('[REALTIME-AGENT-V2] ✨ Enhanced greeting delivered');
    }
    
    console.log('[REALTIME-AGENT-V2] 🟢 Enhanced agent started successfully');
    console.log('[REALTIME-AGENT-V2] 🚀 Ready for next-generation voice interactions');
  },
});

cli.runApp(new WorkerOptions({ 
  agent: fileURLToPath(import.meta.url),
  // Agent name is required for explicit dispatch (telephony integration)
  agentName: 'telephony-voice-agent' // Use same name as v1.0 for compatibility
}));
