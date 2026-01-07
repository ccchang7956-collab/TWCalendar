# 部署到 GitHub Pages 並使用 Cloudflare 自訂網域

本教學將引導您將此網站部署到 GitHub Pages，並設定 Cloudflare 的自訂網域。

## 1. 準備 GitHub Repository

1.  登入您的 [GitHub](https://github.com) 帳號。
2.  建立一個新的 Repository (例如命名為 `TWCalendar-2026`)。
3.  **不要** 勾選 "Initialize this repository with a README"。

## 2. 初始化 Git 並上傳程式碼

打開您的終端機 (VS Code 的 Terminal)，確認您在專案目錄下，依序執行以下指令：

```powershell
# 1. 初始化 Git
git init

# 2. 加入所有檔案
git add .

# 3. 提交第一次變更
git commit -m "Initial commit: 2026 Calendar Website"

# 4. 設定遠端 Repository (請將下面的 URL 換成您剛建立的 GitHub Repo URL)
git remote add origin https://github.com/您的帳號/您的Repo名稱.git

# 5. 上傳程式碼
git push -u origin main
```

## 3. 設定 GitHub Pages

1.  回到 GitHub 網站，進入該 Repository 的 **Settings** (設定) 分頁。
2.  左側選單點擊 **Pages**。
3.  在 **Build and deployment** > **Source** 選擇 **Deploy from a branch**。
4.  在 **Branch** 選擇 `main`，資料夾選擇 `/ (root)`，然後點擊 **Save**。

## 4. 設定自訂網域 (GitHub 端)

1.  在同一個 **Pages** 設定頁面下方。
2.  在 **Custom domain** 欄位輸入您的網域：`TWCalendar.shibaalin.com`。
3.  點擊 **Save**。
    *   這會自動在您的程式碼根目錄產生一個 `CNAME` 檔案 (我們也已經幫您預先建立了)。
4.  勾選 **Enforce HTTPS** (可能需要等待 DNS 生效後才能勾選)。

## 5. 設定 Cloudflare DNS

1.  登入 [Cloudflare Dashboard](https://dash.cloudflare.com)。
2.  選擇您的網域 **`shibaalin.com`**。
3.  點擊 **DNS** > **Records**。
4.  新增一筆記錄：
    *   **Type**: `CNAME`
    *   **Name**: `TWCalendar` (對應到 `TWCalendar.shibaalin.com`)。
    *   **Target**: `ccchang7956-collab.github.io`。
    *   **Proxy status**: 
        *   建議先設為 **DNS only** (灰色雲)，等待 GitHub 驗證並發放 HTTPS 憑證 (約 15-30 分鐘)。
        *   憑證生效後，再回來開啟 **Proxied** (橘色雲) 以獲得 Cloudflare 的 CDN 加速與防護。

## 6. 完成！

完成上述步驟後，稍等幾分鐘，您就可以透過自訂網域瀏覽您的網站了！
