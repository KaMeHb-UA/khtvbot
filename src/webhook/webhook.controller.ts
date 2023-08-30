import { Name } from '@/helpers';
import { Body, Controller, Get } from '@nestjs/common';

@Controller('webhook')
@Name('WebhookController')
export class WebhookController {
	@Get('telegram')
	telegram(@Body() _a: any) {
		return { a: 1 };
	}
}
