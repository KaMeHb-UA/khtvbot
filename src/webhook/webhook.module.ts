import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { Name } from '@/helpers';

@Module({
	controllers: [WebhookController],
})
@Name('WebhookModule')
export class WebhookModule {}
