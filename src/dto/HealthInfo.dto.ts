import { ApiProperty } from '@nestjs/swagger';

export class HealthInfoDto {
  @ApiProperty({ description: '服务名称' })
  name: string;
  @ApiProperty({ description: '是否健康' })
  healthy: boolean;

  constructor(name: string, healthy: boolean) {
    this.name = name;
    this.healthy = healthy;
  }
}
