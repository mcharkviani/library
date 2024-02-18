import * as requestContext from 'request-context';

export class ContextService {
  private static readonly nameSpace: string = 'request';

  static get<T>(key: string): T {
    return requestContext.get(ContextService._getKeyWithNamespace(key));
  }

  static set(key: string, value: any): void {
    requestContext.set(ContextService._getKeyWithNamespace(key), value);
  }

  private static _getKeyWithNamespace(key: string): string {
    return `${ContextService.nameSpace}.${key}`;
  }
}
