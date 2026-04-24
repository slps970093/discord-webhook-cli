# discord-webhook-cli

MIT License

## 安裝

```bash
npm install
```

## 使用方式

### 命令行參數

```bash
npx ts-node src/index.ts \
  --webhook="https://discordapp.com/api/webhooks/..." \
  --thread-id="123456789" \
  --tag-user-id="987654321" \
  --message="自訂訊息內容" \
  --file-content="file1.log,file2.log" \
  --skip-ssl
```

### 環境變數

```bash
DISCORD_WEBHOOK=... \
DISCORD_THREAD_ID=... \
DISCORD_TAG_USER_ID=... \
DISCORD_MESSAGE=... \
DISCORD_FILE_CONTENT=... \
node dist/index.js
```

### 可執行檔

下載對應平台的可執行檔後直接執行：

```bash
# Windows
.\discord-webhook.exe --webhook="..." --thread-id="..."

# Linux / macOS
chmod +x ./discord-webhook
./discord-webhook --webhook="..." --thread-id="..."
```

可執行檔下載：[Releases](https://github.com/<owner>/discord-webhook-cli/releases)

## 參數說明

| 參數 | 必填 | 說明 |
|------|------|------|
| `--webhook` | 是 | Discord webhook URL |
| `--thread-id` | 是 | Discord thread ID |
| `--tag-user-id` | 否 | 要 Tag 的使用者 ID |
| `--message` | 否 | 自訂訊息內容 |
| `--file-content` | 否 | 檔案路徑（多檔案用逗號分隔） |
| `--skip-ssl` | 否 | 略過 SSL 驗證 |

### 環境變數

也可以使用環境變數傳遞參數：

```bash
DISCORD_WEBHOOK=... \
DISCORD_THREAD_ID=... \
DISCORD_TAG_USER_ID=... \
DISCORD_MESSAGE=... \
DISCORD_FILE_CONTENT=... \
node dist/index.js
```

| 環境變數 | 說明 |
|----------|------|
| `DISCORD_WEBHOOK` | Discord webhook URL |
| `DISCORD_THREAD_ID` | Discord thread ID |
| `DISCORD_TAG_USER_ID` | 要 Tag 的使用者 ID |
| `DISCORD_MESSAGE` | 自訂訊息內容 |
| `DISCORD_FILE_CONTENT` | 檔案路徑（多檔案用逗號分隔） |

## 訊息規則

1. 若有 `tag-user-id` 則帶入: `@xxxx [自訂訊息]`
2. 若無 `tag-user-id` 則帶入: `[自訂訊息]`
3. 若無輸入訊息則套用預設模版
