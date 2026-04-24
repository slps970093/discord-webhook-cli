import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';
import { Command } from 'commander';
import FormData from 'form-data';
import fetch from 'node-fetch';

const DEFAULT_MESSAGE_TEMPLATE = "Discord Webhook 訊息\n時間: {timestamp}\n狀態: 已發送";

interface SendOptions {
  tagUserId?: string;
  message?: string;
  fileContent?: string;
  skipSsl?: boolean;
}

async function sendWebhook(webhook: string, threadId: string, options: SendOptions = {}): Promise<void> {
  const { tagUserId, message, fileContent, skipSsl = true } = options;
  const fileHandles: fs.ReadStream[] = [];

  try {
    const url = `${webhook}?thread_id=${threadId}`;
    const messageContent = message ?? DEFAULT_MESSAGE_TEMPLATE.replace(
      '{timestamp}',
      new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' })
    );
    const content = tagUserId ? `<@${tagUserId}> ${messageContent}` : messageContent;

    const formData = new FormData();
    formData.append('content', content);

    if (fileContent) {
      const filePaths = fileContent.split(',').map(f => f.trim());
      filePaths.forEach((filePath, index) => {
        console.log(`[DEBUG] 嘗試附加檔案: "${filePath}", 存在: ${fs.existsSync(filePath)}`);
        if (!fs.existsSync(filePath)) {
          throw new Error(`檔案不存在: ${filePath}`);
        }
        const fileHandle = fs.createReadStream(filePath);
        fileHandles.push(fileHandle);
        formData.append(`files[${index}]`, fileHandle, { filename: path.basename(filePath) });
      });
    }

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      agent: skipSsl ? new https.Agent({ rejectUnauthorized: false }) : undefined
    });

    if (response.status >= 200 && response.status < 300) {
      console.log('[SUCCESS] 訊息已成功發送到 Discord Thread');
    } else {
      console.log(`[ERROR] Discord 返回狀態碼: ${response.status}`);
      process.exit(1);
    }
  } catch (error: any) {
    console.log(`[ERROR] 發送失敗: ${error.message}`);
    throw error;
  } finally {
    for (const fh of fileHandles) {
      if (!fh.destroyed) fh.destroy();
    }
  }
}

const program = new Command();

program
  .name('discord-webhook')
  .description('發送訊息到 Discord Thread')
  .version('1.0.0')
  .requiredOption('--webhook <url>', 'Discord webhook URL', process.env.DISCORD_WEBHOOK)
  .requiredOption('--thread-id <id>', 'Discord thread ID', process.env.DISCORD_THREAD_ID)
  .option('--tag-user-id <id>', '要 Tag 的使用者 ID', process.env.DISCORD_TAG_USER_ID)
  .option('--message <content>', '自訂訊息內容', process.env.DISCORD_MESSAGE)
  .option('--file-content <path>', '檔案路徑（多檔案用逗號分隔）', process.env.DISCORD_FILE_CONTENT)
  .option('--skip-ssl', '略過 SSL 驗證')
  .action(async (options) => {
    await sendWebhook(options.webhook, options.threadId, {
      tagUserId: options.tagUserId,
      message: options.message,
      fileContent: options.fileContent,
      skipSsl: options.skipSsl
    });
  });

program.parse();
