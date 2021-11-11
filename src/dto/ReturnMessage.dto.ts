import { ApiProperty } from '@nestjs/swagger';
import { HttpException } from '@nestjs/common';
import { HealthInfoDto } from './HealthInfo.dto';

export interface BlankReturnMessage {
  statusCode: number;
  message: string;
  success: boolean;
}

export interface ReturnMessage<T> extends BlankReturnMessage {
  data?: T;
}

export class BlankReturnMessageDto implements BlankReturnMessage {
  @ApiProperty({ description: '返回状态' })
  statusCode: number;
  @ApiProperty({ description: '返回信息' })
  message: string;
  @ApiProperty({ description: '是否成功' })
  success: boolean;
  constructor(statusCode: number, message?: string) {
    this.statusCode = statusCode;
    this.message = message || 'success';
    this.success = statusCode < 400;
  }

  toException() {
    return new HttpException(this, this.statusCode);
  }
}

export class ReturnMessageDto<T>
  extends BlankReturnMessageDto
  implements ReturnMessage<T> {
  @ApiProperty({ description: '返回内容' })
  data?: T;
  constructor(statusCode: number, message?: string, data?: T) {
    super(statusCode, message);
    this.data = data;
  }
}

export class HealthyReturnMessageDto extends BlankReturnMessageDto {
  @ApiProperty({ description: '健康状态', type: HealthInfoDto })
  data: HealthInfoDto;
}

export class HealthyArrayReturnMessageDto extends BlankReturnMessageDto {
  @ApiProperty({ description: '健康状态', type: [HealthInfoDto] })
  data: HealthInfoDto[];
}
