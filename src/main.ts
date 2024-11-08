import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';
import { AppMode, MODE, MQTT_URL, PORT } from './_config/dotenv';
import { AppModule } from './app.module';

async function bootstrap() {
  if (MODE === AppMode.APP) {
    const app = await NestFactory.create(AppModule);

    const config = new DocumentBuilder()
      .setTitle('TTDN')
      .setDescription('TTDN')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);

    app.use(cookieParser());

    // Authentication & Session
    app.use(
      session({
        secret: process.env.SECRET_KEY, // to sign session id
        saveUninitialized: false, // will default to false in near future: https://github.com/expressjs/session#saveuninitialized
        resave: false,
        rolling: true, // keep session alive
        cookie: {
          maxAge: 30 * 60 * 1000, // session expires in 1hr, refreshed by `rolling: true` option.
          httpOnly: true, // so that cookie can't be accessed via client-side script
        },
      }),
    );

    await app
      .listen(PORT)
      .then(() => {
        console.log(`App is running on port ${PORT}`);
      })
      .catch((error) => {
        console.error('Error starting app', error);
      });
    return;
  }

  if (MODE === AppMode.CRAWLER) {
    const app = await NestFactory.createMicroservice<MicroserviceOptions>(
      AppModule,
      {
        transport: Transport.MQTT,
        options: {
          url: MQTT_URL,
        },
      },
    );
    await app.listen().then(() => {
      console.log('Crawler is running');
    });
  }
}

bootstrap();
