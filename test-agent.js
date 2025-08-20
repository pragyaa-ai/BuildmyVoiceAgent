// Minimal test agent to verify basic connectivity
import * as agents from '@livekit/agents';
import * as deepgram from '@livekit/agents-plugin-deepgram';
import * as elevenlabs from '@livekit/agents-plugin-elevenlabs';
import * as openai from '@livekit/agents-plugin-openai';
import * as silero from '@livekit/agents-plugin-silero';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '.env');
dotenv.config({ path: envPath });

console.log('Starting minimal test agent...');

agents.cli.runApp(
  new agents.WorkerOptions({
    agent: fileURLToPath(import.meta.url),
    agentName: 'test-voice-agent'
  }),
  async (ctx) => {
    console.log(`Test agent received job: ${ctx.job.id}`);
    console.log(`Room: ${ctx.room.name}`);
    
    await ctx.connect();
    console.log('Connected to room successfully');
    
    const participant = await ctx.waitForParticipant();
    console.log(`Participant joined: ${participant.identity}`);
    
    // Simple agent that just says hello
    const agent = new agents.pipeline.VoicePipelineAgent(
      new silero.VAD(),
      new deepgram.STT(),
      new openai.LLM(),
      new elevenlabs.TTS(),
      {
        chatCtx: new agents.llm.ChatContext().append({
          role: 'system',
          text: 'You are a test voice assistant. Say hello and confirm you can hear the caller.'
        })
      }
    );
    
    agent.start(ctx.room, participant);
    console.log('Agent started successfully');
    
    // Simple greeting
    await agent.say('Hello! This is a test. Can you hear me?', true);
    console.log('Greeting sent');
  }
);
