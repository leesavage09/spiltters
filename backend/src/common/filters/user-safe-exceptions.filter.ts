import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { UserSafeException } from '../errors/useSafeError';

@Catch(UserSafeException)
export class UserSafeExceptionsFilter implements ExceptionFilter {
  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: UserSafeException, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const body = {
      statusCode: exception.getStatus(),
      message: exception.message,
    };

    httpAdapter.reply(ctx.getResponse(), body, exception.getStatus());
  }
}
