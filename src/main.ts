import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app';
import {
	FastifyAdapter,
	type NestFastifyApplication,
} from '@nestjs/platform-fastify';

async function main() {
	const app = await NestFactory.create<NestFastifyApplication>(
		AppModule,
		new FastifyAdapter(),
	);
	app.enableShutdownHooks();
	await app.listen(3000, '0.0.0.0');
}

void main();
