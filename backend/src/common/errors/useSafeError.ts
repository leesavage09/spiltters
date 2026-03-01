import { HttpException, HttpStatus } from '@nestjs/common';

export class UserSafeException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(
      {
        message,
      },
      status,
    );
  }
}
