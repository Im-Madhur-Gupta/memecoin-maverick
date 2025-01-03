import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { LoggerService } from 'libs/logger/src';
import { CreateFereAgentDto } from './dto/create-fere-agent.dto';
import { CreateFereAgentResponse } from './types/create-fere-agent.interface';
import { firstValueFrom } from 'rxjs';
import { GetFereAgentHoldingsResponse } from './types/get-fere-agent-holdings.interface';
import { ConfigService } from '@nestjs/config';
import { FERE_CONFIG_KEYS } from './config';
import { FERE_API_BASE_URL } from './constants';
import { COMMON_CONFIG_KEYS } from 'src/common/config';

@Injectable()
export class FereService {
  private readonly baseUrl: string = FERE_API_BASE_URL;
  private readonly apiKey: string;
  private readonly userId: string;
  private readonly originUrl: string;
  constructor(
    private readonly logger: LoggerService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.userId = this.configService.get(FERE_CONFIG_KEYS.USER_ID);
    this.apiKey = this.configService.get(FERE_CONFIG_KEYS.API_KEY);
    this.originUrl =
      this.configService.get(COMMON_CONFIG_KEYS.ORIGIN_URL) || 'localhost:3000';
  }

  private getApiHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-FRIDAY-KEY': this.apiKey,
      'X-Fere-Userid': this.userId,
      Origin: this.originUrl,
    };
  }

  async createAgent(
    createFereAgentDto: CreateFereAgentDto,
  ): Promise<CreateFereAgentResponse> {
    try {
      const {
        name,
        description,
        personaPrompt,
        decisionPromptPool,
        decisionPromptPortfolio,
      } = createFereAgentDto;

      const payload = {
        user_id: this.userId,
        name,
        description,
        persona: personaPrompt,
        data_source: 'trending',
        decision_prompt_pool: decisionPromptPool,
        decision_prompt_portfolio: decisionPromptPortfolio,
        dry_run: true,
        dry_run_initial_usd: 1000,
        max_investment_per_session: 0.2,
        stop_loss: 0.5,
        trailing_stop_loss: 0.3,
        take_profit: 1.0,
      };

      const url = `${this.baseUrl}/agent/`;
      const { data } = await firstValueFrom(
        this.httpService.put<CreateFereAgentResponse>(url, payload, {
          headers: this.getApiHeaders(),
        }),
      );

      this.logger.info('Fere agent created', {
        id: data.id,
      });

      return data;
    } catch (error) {
      this.logger.error('Failed to create Fere agent', { error });
      throw error;
    }
  }

  async getHoldings(agentId: string): Promise<GetFereAgentHoldingsResponse> {
    try {
      const url = `${this.baseUrl}/agent/${agentId}/holdings/`;
      const { data } = await firstValueFrom(
        this.httpService.get<GetFereAgentHoldingsResponse>(url, {
          headers: this.getApiHeaders(),
        }),
      );

      return data;
    } catch (error) {
      this.logger.error('Failed to get Fere agent holdings', {
        agentId,
        error,
      });
      throw error;
    }
  }
}
