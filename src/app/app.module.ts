import { Name } from '@/helpers';
import { WebhookModule } from '@/webhook';
import { Module } from '@nestjs/common';

@Module({
	imports: [WebhookModule],
})
@Name('AppModule')
export class AppModule {}
