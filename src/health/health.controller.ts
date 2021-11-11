import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import {
  BlankReturnMessageDto,
  HealthyArrayReturnMessageDto,
  HealthyReturnMessageDto,
  ReturnMessageDto,
} from '../dto/ReturnMessage.dto';
import { HealthService } from './health.service';

@Controller('health')
@ApiTags('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get('route')
  @ApiOperation({ summary: '全体路由后端健康状态' })
  @ApiOkResponse({ type: HealthyArrayReturnMessageDto })
  healthOfAllRoutes() {
    const result = this.healthService.healthOfAllRoutes();
    return new ReturnMessageDto(200, 'success', result);
  }

  @Get('route/:name')
  @ApiOperation({ summary: '指定路由后端健康状态' })
  @ApiParam({ name: 'name', description: '路由名称' })
  @ApiOkResponse({ type: HealthyReturnMessageDto })
  healthOfRoute(@Param('name') name: string) {
    if (!name) {
      throw new BlankReturnMessageDto(400, 'missing name').toException();
    }
    const result = this.healthService.healthOfRoute(name);
    if (!result) {
      throw new BlankReturnMessageDto(404, 'not found').toException();
    }
    return new ReturnMessageDto(200, 'success', result);
  }

  @Get('bot')
  @ApiOperation({ summary: '全体机器人后端健康状态' })
  @ApiOkResponse({ type: HealthyArrayReturnMessageDto })
  healthOfAllBots() {
    const result = this.healthService.healthOfAllBots();
    return new ReturnMessageDto(200, 'success', result);
  }

  @Get('bot/:selfId')
  @ApiOperation({ summary: '指定机器人后端健康状态' })
  @ApiParam({ name: 'selfId', description: '机器人 ID' })
  @ApiOkResponse({ type: HealthyReturnMessageDto })
  HealthOfBot(@Param('selfId') name: string) {
    if (!name) {
      throw new BlankReturnMessageDto(400, 'missing bot ID').toException();
    }
    const result = this.healthService.healthOfBot(name);
    if (!result) {
      throw new BlankReturnMessageDto(404, 'not found').toException();
    }
    return new ReturnMessageDto(200, 'success', result);
  }
}
