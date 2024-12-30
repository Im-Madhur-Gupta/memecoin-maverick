import { AgentPersona } from '../types/agent-persona.enum';
import { CreateAgentDto } from '../dto/create-agent.dto';
import { CreateAgentResponse } from '../types/create-agent.interface';

export const createAgentExample: CreateAgentDto = {
  name: 'MoonBot',
  description: 'A bot that chases moon shots',
  persona: AgentPersona.MOON_CHASER,
  ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
};

export const createAgentResponseExample: CreateAgentResponse = {
  id: 'agent_123456',
  name: 'MoonBot',
  description: 'A bot that chases moon shots',
  persona: AgentPersona.MOON_CHASER,
  ownerAddress: '0x1234567890abcdef1234567890abcdef12345678',
  solPvtKey: 'abc123...',
  evmPvtKey: 'def456...',
  mnemonic: 'word1 word2 word3...',
  evmAddress: '0x1234567890abcdef1234567890abcdef12345678',
  solAddress: 'JAJMHzapWE55Gk2oQ1wgn3GLuZnMsDsJ4Wrwt4jbYR1p',
  isActive: true,
  createdAt: new Date(),
};