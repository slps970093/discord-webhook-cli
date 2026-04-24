import * as fs from 'fs';
import * as path from 'path';
import { Command } from 'commander';
import FormData from 'form-data';
import fetch from 'node-fetch';

class DiscordWebhookThreadSender {
  private webhook: string;
  private threadId: string;
  private tagUserId?: string;
  private message?: string;
  private fileContent?: string;
  private skipSsl: boolean;

  private static readonly DEFAULT_MESSAGE_TEMPLATE = 
    "Discord Webhook 訊息\n時間: {timestamp}\n狀態: 已發送";

  constructor(webhook: string, threadId: string, options: Partial<{
    tagUserId: string;
    message: string;
    fileContent: string;
    skipSsl: boolean;
  }> = {}) {
    this.webhook = webhook;
    this.threadId = threadId;
    this.tagUserId = options.tagUserId;
    this.message = options.message;
    this.fileContent = options.fileContent;
    this.skipSsl = options.skipSsl ?? true;
  }

  public async send(): Promise<boolean> {
    let fileHandles: fs.ReadStream[] = [];

    try {
      const url = `${this.webhook}?thread_id=${this.threadId}`;
      const content = this.buildMessageContent();

      const formData = new FormData();
      formData.append('content', content);

      if (this.fileContent) {
        const filePaths = this.fileContent.split(',').map(f => f.trim());
        for (const filePath of filePaths) {
          if (fs.existsSync(filePath)) {
            const fileHandle = fs.createReadStream(filePath);
            fileHandles.push(fileHandle);
            formData.append('file', fileHandle, {
              filename: path.basename(filePath)
            });
          }
        }
      }

      const response = await fetch(url, {
        method: 'POST',
        body: formData,
        agent: this.skipSsl ? new (require('https').Agent)({ rejectUnauthorized: false }) : undefined
      });

      const statusCode = response.status;

      if (statusCode >= 200 && statusCode < 300) {
        console.log('[SUCCESS] 訊息已成功發送到 Discord Thread');
        return true;
      }

      console.log(`[ERROR] Discord 返回狀態碼: ${statusCode}`);
      return false;
    } catch (error: any) {
      console.log(`[ERROR] 發送失敗: ${error.message}`);
      throw error;
    } finally {
      for (const fileHandle of fileHandles) {
        if (!fileHandle.destroyed) {
          fileHandle.destroy();
        }
      }
    }
  }

  private buildMessageContent(): string {
    const messageContent = this.message || this.getDefaultMessage();
    
    if (this.tagUserId) {
      return `<@${this.tagUserId}> ${messageContent}`;
    }
    
    return messageContent;
  }

  private getDefaultMessage(): string {
    return DiscordWebhookThreadSender.DEFAULT_MESSAGE_TEMPLATE.replace(
      '{timestamp}',
      new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
    );
  }
}

const program = new Command();

program
  .name('discord-webhook')
  .description('發送訊息到 Discord Thread')
  .version('1.0.0')
  .requiredOption('--webhook <url>', 'Discord webhook URL')
  .requiredOption('--thread-id <id>', 'Discord thread ID')
  .option('--tag-user-id <id>', '要 Tag 的使用者 ID')
  .option('--message <content>', '自訂訊息內容')
  .option('--file-content <path>', '檔案路徑（多檔案用逗號分隔）')
  .option('--skip-ssl', '略過 SSL 驗證')
  .action(async (options) => {
    const sender = new DiscordWebhookThreadSender(
      options.webhook,
      options.threadId,
      {
        tagUserId: options.tagUserId,
        message: options.message,
        fileContent: options.fileContent,
        skipSsl: options.skipSsl
      }
    );
    await sender.send();
  });

program.parse();
