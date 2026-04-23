import { Injectable, Logger } from '@nestjs/common';
import { randomBytes } from 'crypto';

@Injectable()
export class GreenSmsService {
  private readonly logger = new Logger(GreenSmsService.name);

  async send(
    recipient: string,
    body: string,
  ): Promise<{ ok: true; externalId: string }> {
    const externalId = `stub-${randomBytes(6).toString('hex')}`;
    this.logger.log(
      `[GreenSMS stub] → ${recipient}: ${body.slice(0, 60)}${body.length > 60 ? '...' : ''} (${externalId})`,
    );
    return { ok: true, externalId };
  }
}
