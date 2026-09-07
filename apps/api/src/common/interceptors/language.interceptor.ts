import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

/**
 * Extracts language from Accept-Language header or query parameter
 * and makes it available via request context for translation services.
 */
@Injectable()
export class LanguageInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    // Try to get language from Accept-Language header
    let language = request.headers['accept-language'] || request.headers['Accept-Language'];
    
    // Fall back to query parameter
    if (!language) {
      language = request.query?.language;
    }
    
    // Normalize language codes
    if (language) {
      const normalized = this.normalizeLanguage(language);
      request['locale'] = normalized;
    }
    
    return next.handle();
  }

  private normalizeLanguage(code: string): string {
    const c = (code || 'en').trim().toLowerCase();
    if (c === 'cn' || c === 'zh' || c === 'zh-cn' || c === 'chs') {
      return 'zh-CN';
    }
    if (c === 'en' || c === 'en-us' || c === 'en-gb') return 'en';
    if (c === 'am' || c === 'amh') return 'am';
    if (c === 'om' || c === 'orm') return 'om';
    return c;
  }
}
