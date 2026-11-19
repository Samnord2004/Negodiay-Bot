import fs from "fs";
import os from "os";
import path from "path";
import { spawn, spawnSync, ChildProcess } from "child_process";
import { getConfigDir } from "../db";

export type TunnelMode = "quick" | "token";
export type TunnelState = "stopped" | "starting" | "running" | "error";

export interface TunnelConfig {
  mode: TunnelMode;
  customDomain: string;
  tunnelToken: string;
  autoStart: boolean;
}

export interface TunnelStatus {
  installed: boolean;
  binaryPath: string | null;
  installing: boolean;
  state: TunnelState;
  mode: TunnelMode;
  publicUrl: string | null;
  customDomain: string;
  hasToken: boolean;
  tokenPreview: string;
  autoStart: boolean;
  localPort: number | null;
  startedAt: string | null;
  error: string | null;
  logs: string[];
}

class CloudflareTunnelManager {
  private proc: ChildProcess | null = null;
  private state: TunnelState = "stopped";
  private publicUrl: string | null = null;
  private startedAt: string | null = null;
  private errorMsg: string | null = null;
  private logs: string[] = [];
  private installing: boolean = false;
  private activePort: number = 8090;
  private config: TunnelConfig = {
    mode: "quick",
    customDomain: "",
    tunnelToken: "",
    autoStart: false
  };

  constructor() {
    this.loadConfig();
  }

  private getConfigFile(): string {
    return path.join(getConfigDir(), "tunnel_config.json");
  }

  private getLocalBinDir(): string {
    return path.join(getConfigDir(), "bin");
  }

  private getLocalBinaryPath(): string {
    const isWin = os.platform() === "win32";
    return path.join(this.getLocalBinDir(), isWin ? "cloudflared.exe" : "cloudflared");
  }

  private pushLog(line: string) {
    const clean = line.trim();
    if (!clean) return;
    // Mask any token if present in logs
    const masked = this.config.tunnelToken && clean.includes(this.config.tunnelToken)
      ? clean.replace(this.config.tunnelToken, "***TOKEN***")
      : clean;
    this.logs.push(`[${new Date().toLocaleTimeString("ru-RU")}] ${masked}`);
    if (this.logs.length > 40) {
      this.logs = this.logs.slice(-40);
    }
  }

  public loadConfig() {
    try {
      const file = this.getConfigFile();
      if (fs.existsSync(file)) {
        const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
        this.config = {
          mode: parsed.mode === "token" ? "token" : "quick",
          customDomain: typeof parsed.customDomain === "string" ? parsed.customDomain : "",
          tunnelToken: typeof parsed.tunnelToken === "string" ? parsed.tunnelToken : "",
          autoStart: Boolean(parsed.autoStart)
        };
      }
    } catch (e) {
      console.error("[Tunnel] Failed to load tunnel_config.json:", e);
    }
  }

  public saveConfig(partial: Partial<TunnelConfig>) {
    this.config = {
      ...this.config,
      ...partial
    };
    try {
      getConfigDir();
      fs.writeFileSync(this.getConfigFile(), JSON.stringify(this.config, null, 2), "utf-8");
    } catch (e) {
      console.error("[Tunnel] Failed to save tunnel_config.json:", e);
    }
  }

  public findBinary(): string | null {
    // 1. Explicit env override
    if (process.env.CLOUDFLARED_PATH && fs.existsSync(process.env.CLOUDFLARED_PATH)) {
      return process.env.CLOUDFLARED_PATH;
    }

    // 2. Local bin folder inside app config directory
    const localBin = this.getLocalBinaryPath();
    if (fs.existsSync(localBin)) {
      return localBin;
    }

    // 3. Common system locations (macOS Homebrew, Linux, Windows Program Files)
    const candidates =
      os.platform() === "win32"
        ? [
            "C:\\Program Files\\cloudflared\\cloudflared.exe",
            "C:\\Program Files (x86)\\cloudflared\\cloudflared.exe",
            path.join(os.homedir(), "cloudflared.exe")
          ]
        : [
            "/opt/homebrew/bin/cloudflared",
            "/usr/local/bin/cloudflared",
            "/usr/bin/cloudflared",
            path.join(os.homedir(), ".local", "bin", "cloudflared")
          ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    // 4. System PATH lookup
    try {
      const cmd = os.platform() === "win32" ? "where" : "which";
      const res = spawnSync(cmd, ["cloudflared"], { encoding: "utf-8", timeout: 2000 });
      if (res.status === 0 && res.stdout) {
        const firstLine = res.stdout.split(/\r?\n/)[0]?.trim();
        if (firstLine && fs.existsSync(firstLine)) {
          return firstLine;
        }
      }
    } catch (e) {
      // ignore
    }

    return null;
  }

  public async installBinary(): Promise<{ success: boolean; binaryPath?: string; message: string }> {
    if (this.installing) {
      return { success: false, message: "Установка cloudflared уже выполняется..." };
    }

    const existing = this.findBinary();
    if (existing) {
      return { success: true, binaryPath: existing, message: `cloudflared уже установлен: ${existing}` };
    }

    this.installing = true;
    this.errorMsg = null;
    this.pushLog("Начинаем загрузку официального клиента Cloudflare Tunnel...");

    try {
      const platform = os.platform();
      const arch = os.arch(); // 'arm64' | 'x64'
      let downloadUrl = "";
      let isTgz = false;

      if (platform === "darwin") {
        isTgz = true;
        downloadUrl =
          arch === "arm64"
            ? "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-arm64.tgz"
            : "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-darwin-amd64.tgz";
      } else if (platform === "win32") {
        downloadUrl = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe";
      } else {
        downloadUrl =
          arch === "arm64"
            ? "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64"
            : "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64";
      }

      const binDir = this.getLocalBinDir();
      if (!fs.existsSync(binDir)) {
        fs.mkdirSync(binDir, { recursive: true });
      }

      const targetPath = this.getLocalBinaryPath();
      this.pushLog(`Скачивание: ${downloadUrl}`);

      const response = await fetch(downloadUrl, { redirect: "follow" });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} при скачивании cloudflared`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (isTgz) {
        const tgzPath = path.join(binDir, "cloudflared.tgz");
        fs.writeFileSync(tgzPath, buffer);
        const tarRes = spawnSync("tar", ["-xzf", tgzPath, "-C", binDir], { encoding: "utf-8" });
        try {
          fs.unlinkSync(tgzPath);
        } catch (e) {}
        if (tarRes.status !== 0) {
          throw new Error(`Ошибка распаковки архива: ${tarRes.stderr || "tar failed"}`);
        }
      } else {
        fs.writeFileSync(targetPath, buffer);
      }

      if (platform !== "win32" && fs.existsSync(targetPath)) {
        fs.chmodSync(targetPath, 0o755);
      }

      if (!fs.existsSync(targetPath)) {
        throw new Error("Файл cloudflared не найден после установки");
      }

      this.pushLog(`Успешно установлен: ${targetPath}`);
      return { success: true, binaryPath: targetPath, message: "Cloudflare Tunnel (cloudflared) успешно установлен!" };
    } catch (err: any) {
      const msg = err?.message || String(err);
      this.errorMsg = msg;
      this.pushLog(`Ошибка установки: ${msg}`);
      return { success: false, message: `Не удалось установить cloudflared: ${msg}` };
    } finally {
      this.installing = false;
    }
  }

  public async start(
    localPort: number,
    options?: Partial<TunnelConfig>
  ): Promise<{ success: boolean; status: TunnelStatus; message: string }> {
    this.activePort = localPort;

    if (options) {
      this.saveConfig({
        mode: options.mode ?? this.config.mode,
        customDomain: options.customDomain !== undefined ? options.customDomain.trim() : this.config.customDomain,
        tunnelToken:
          options.tunnelToken !== undefined && options.tunnelToken.trim() !== ""
            ? options.tunnelToken.trim()
            : this.config.tunnelToken,
        autoStart: options.autoStart !== undefined ? Boolean(options.autoStart) : this.config.autoStart
      });
    }

    if (this.proc) {
      this.stop();
    }

    let binary = this.findBinary();
    if (!binary) {
      const installRes = await this.installBinary();
      if (!installRes.success || !installRes.binaryPath) {
        this.state = "error";
        this.errorMsg = installRes.message;
        return { success: false, status: this.getStatus(), message: installRes.message };
      }
      binary = installRes.binaryPath;
    }

    if (this.config.mode === "token" && !this.config.tunnelToken) {
      this.state = "error";
      this.errorMsg = "Для режима своего домена необходимо указать Cloudflare Tunnel Token.";
      return { success: false, status: this.getStatus(), message: this.errorMsg };
    }

    this.state = "starting";
    this.errorMsg = null;
    this.publicUrl = this.config.mode === "token" && this.config.customDomain ? this.normalizeDomain(this.config.customDomain) : null;
    this.startedAt = new Date().toISOString();
    this.logs = [];

    const args =
      this.config.mode === "token"
        ? ["tunnel", "--no-autoupdate", "run", "--token", this.config.tunnelToken]
        : ["tunnel", "--no-autoupdate", "--url", `http://127.0.0.1:${localPort}`];

    this.pushLog(
      this.config.mode === "token"
        ? `Запуск постоянного туннеля для домена ${this.publicUrl || "(настроен в Cloudflare)"}...`
        : `Запуск быстрого HTTPS-туннеля на http://127.0.0.1:${localPort}...`
    );

    try {
      const child = spawn(binary, args, {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true
      });
      this.proc = child;

      const handleOutput = (chunk: Buffer) => {
        const text = chunk.toString("utf-8");
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          if (!line.trim()) continue;
          this.pushLog(line);

          // Parse Quick Tunnel public URL
          const match = line.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
          if (match) {
            this.publicUrl = match[0];
            this.state = "running";
            console.log(`\n🌐 [Cloudflare Tunnel] Публичный HTTPS-домен активен: ${this.publicUrl}\n`);
          }

          // Detect Registered tunnel connection for token mode
          if (
            this.config.mode === "token" &&
            (line.includes("Registered tunnel connection") || line.includes("Connection registered"))
          ) {
            this.state = "running";
            if (!this.publicUrl && this.config.customDomain) {
              this.publicUrl = this.normalizeDomain(this.config.customDomain);
            }
          }

          if (line.toLowerCase().includes("failed to") || line.toLowerCase().includes("unauthorized")) {
            if (line.toLowerCase().includes("token")) {
              this.errorMsg = "Неверный или недействительный Cloudflare Tunnel Token.";
            }
          }
        }
      };

      child.stdout?.on("data", handleOutput);
      child.stderr?.on("data", handleOutput);

      child.on("error", (err) => {
        this.state = "error";
        this.errorMsg = err.message;
        this.pushLog(`Ошибка процесса: ${err.message}`);
        this.proc = null;
      });

      child.on("exit", (code, signal) => {
        this.pushLog(`Туннель остановлен (код: ${code ?? "null"}, сигнал: ${signal ?? "none"})`);
        if (this.state !== "stopped") {
          this.state = code === 0 ? "stopped" : "error";
          if (code !== 0 && !this.errorMsg) {
            this.errorMsg = `Процесс cloudflared завершился с кодом ${code}`;
          }
        }
        this.proc = null;
      });

      // Wait briefly (up to 6s) for Quick URL or connection confirmation
      const readState = (): TunnelState => this.state;
      for (let i = 0; i < 12; i++) {
        const current = readState();
        if (current === "running" || current === "error") break;
        await new Promise((r) => setTimeout(r, 500));
      }

      const finalState = readState();
      return {
        success: finalState !== "error",
        status: this.getStatus(),
        message:
          finalState === "running"
            ? `Туннель активен: ${this.publicUrl || "подключен к Cloudflare"}`
            : this.errorMsg || "Туннель запускается..."
      };
    } catch (err: any) {
      this.state = "error";
      this.errorMsg = err?.message || String(err);
      return { success: false, status: this.getStatus(), message: this.errorMsg };
    }
  }

  private normalizeDomain(domain: string): string {
    const trimmed = domain.trim().replace(/\/+$/, "");
    if (!trimmed) return "";
    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
      return trimmed;
    }
    return `https://${trimmed}`;
  }

  public stop(): TunnelStatus {
    this.state = "stopped";
    if (this.proc) {
      try {
        this.proc.kill("SIGTERM");
      } catch (e) {
        try {
          this.proc.kill();
        } catch (e2) {}
      }
      this.proc = null;
    }
    this.publicUrl = null;
    this.startedAt = null;
    this.pushLog("Туннель остановлен администратором.");
    return this.getStatus();
  }

  public async autoStartIfEnabled(localPort: number) {
    this.activePort = localPort;
    if (this.config.autoStart) {
      console.log("[Tunnel] Auto-starting Cloudflare Tunnel...");
      await this.start(localPort);
    }
  }

  public getStatus(): TunnelStatus {
    const binaryPath = this.findBinary();
    const tok = this.config.tunnelToken || "";
    const tokenPreview = tok.length > 10 ? `${tok.slice(0, 6)}...${tok.slice(-4)}` : tok ? "***" : "";

    return {
      installed: Boolean(binaryPath),
      binaryPath,
      installing: this.installing,
      state: this.state,
      mode: this.config.mode,
      publicUrl: this.publicUrl,
      customDomain: this.config.customDomain,
      hasToken: Boolean(tok),
      tokenPreview,
      autoStart: this.config.autoStart,
      localPort: this.activePort,
      startedAt: this.startedAt,
      error: this.errorMsg,
      logs: this.logs.slice(-20)
    };
  }
}

export const cloudflareTunnelManager = new CloudflareTunnelManager();
