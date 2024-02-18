import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';

import { UserEntity } from '../../modules/users/entities';

@Injectable()
export class AuthUserInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: any = context.switchToHttp().getRequest();
    const user: UserEntity = <UserEntity>request.user;
    request['user'] = user;
    // ContextService.set('user', user);

    return next.handle();
  }
}
