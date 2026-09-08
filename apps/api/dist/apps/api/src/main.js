"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const config = app.get(config_1.ConfigService);
    const prefix = config.get('API_PREFIX') ?? 'api/v1';
    app.setGlobalPrefix(prefix, { exclude: ['health'] });
    app.use((req, res, next) => {
        res.setHeader('Content-Type', 'application/json');
        next();
    });
    const express = require('express');
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const origins = (config.get('CORS_ORIGINS') ?? 'http://localhost:3000,http://localhost:3003')
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean);
    app.enableCors({ origin: origins, credentials: true });
    const port = Number(config.get('PORT') ?? 3001);
    await app.listen(port, '0.0.0.0');
    console.log(`ETHIO-BRIDGE API listening on port ${port}/${prefix}`);
}
void bootstrap();
//# sourceMappingURL=main.js.map