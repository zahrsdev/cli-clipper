import TelegramBot from 'node-telegram-bot-api';

export interface VideoDeliveryOptions {
  videoPath: string;
  caption?: string;
  duration?: number;
}

export class TelegramAdapter {
  private bot: TelegramBot;
  private chatId: string;

  constructor(token: string, chatId: string) {
    this.bot = new TelegramBot(token, { polling: false });
    this.chatId = chatId;
  }

  async sendVideo(options: VideoDeliveryOptions): Promise<void> {
    const { videoPath, caption } = options;

    await this.bot.sendVideo(this.chatId, videoPath, {
      caption: caption || '🎬 Your viral short is ready! #shorts',
      parse_mode: 'HTML'
    });
  }

  async sendMessage(text: string): Promise<void> {
    await this.bot.sendMessage(this.chatId, text, { parse_mode: 'HTML' });
  }

  async sendProgress(message: string): Promise<void> {
    await this.sendMessage(`⏳ ${message}`);
  }

  async sendSuccess(message: string): Promise<void> {
    await this.sendMessage(`✅ ${message}`);
  }

  async sendError(message: string): Promise<void> {
    await this.sendMessage(`❌ ${message}`);
  }
}
