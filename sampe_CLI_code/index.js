#!/usr/bin/env node

const { Client } = require("@modelcontextprotocol/sdk/client/index.js");
const { StdioClientTransport } = require("@modelcontextprotocol/sdk/client/stdio.js");
const readline = require("readline");
const path = require("path");

// ─── Config ───────────────────────────────────────────────────────────────────
const NPX_PATH = process.env.NPX_PATH || "/Users/vovinhloc/.volta/bin/npx";
const MCP_PACKAGE = "@floriscornel/teams-mcp@latest";

// ─── Colors ───────────────────────────────────────────────────────────────────
const c = {
    reset: "\x1b[0m",
    bold: "\x1b[1m",
    dim: "\x1b[2m",
    cyan: "\x1b[36m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    blue: "\x1b[34m",
    magenta: "\x1b[35m",
};

const log = {
    info: (msg) => console.log(`${c.cyan}ℹ${c.reset}  ${msg}`),
    success: (msg) => console.log(`${c.green}✓${c.reset}  ${msg}`),
    error: (msg) => console.error(`${c.red}✗${c.reset}  ${msg}`),
    warn: (msg) => console.log(`${c.yellow}⚠${c.reset}  ${msg}`),
    title: (msg) => console.log(`\n${c.bold}${c.blue}${msg}${c.reset}\n`),
    divider: () => console.log(`${c.dim}${"─".repeat(50)}${c.reset}`),
};

// ─── MCP Client ───────────────────────────────────────────────────────────────
async function createMCPClient() {
    const transport = new StdioClientTransport({
        command: NPX_PATH,
        args: ["-y", MCP_PACKAGE],
    });

    const client = new Client(
        { name: "teams-cli", version: "1.0.0" },
        { capabilities: {} }
    );

    await client.connect(transport);
    return client;
}

// ─── Helper: call MCP tool ─────────────────────────────────────────────────
async function callTool(client, toolName, args = {}) {
    const result = await client.callTool({ name: toolName, arguments: args });
    if (result.isError) throw new Error(result.content[0]?.text || "Tool error");
    return result.content[0]?.text;
}

// ─── Features ─────────────────────────────────────────────────────────────────

// 1. Liệt kê tất cả Teams
async function listTeams(client) {
    log.title("📋 Danh sách Teams");
    const raw = await callTool(client, "list_teams");
    const data = JSON.parse(raw);
    const teams = data.value || data;

    if (!teams.length) {
        log.warn("Không tìm thấy team nào.");
        return [];
    }

    teams.forEach((t, i) => {
        console.log(`  ${c.cyan}[${i + 1}]${c.reset} ${c.bold}${t.displayName}${c.reset}`);
        console.log(`      ${c.dim}ID: ${t.id}${c.reset}`);
    });

    return teams;
}

// 2. Liệt kê channels của một team
async function listChannels(client, teamId) {
    log.title("📂 Danh sách Channels");
    const raw = await callTool(client, "list_channels", { teamId });
    const data = JSON.parse(raw);
    const channels = data.value || data;

    if (!channels.length) {
        log.warn("Không tìm thấy channel nào.");
        return [];
    }

    channels.forEach((ch, i) => {
        const type = ch.membershipType === "standard" ? "🔓" : "🔒";
        console.log(`  ${c.cyan}[${i + 1}]${c.reset} ${type} ${c.bold}${ch.displayName}${c.reset}`);
        console.log(`      ${c.dim}ID: ${ch.id}${c.reset}`);
    });

    return channels;
}

// 3. Đọc tin nhắn từ channel
async function readMessages(client, teamId, channelId, limit = 10) {
    log.title("💬 Tin nhắn gần đây");
    const raw = await callTool(client, "get_channel_messages", {
        teamId,
        channelId,
        limit,
    });

    const data = JSON.parse(raw);
    const messages = data.value || data;

    if (!messages.length) {
        log.warn("Không có tin nhắn nào.");
        return;
    }

    log.divider();
    messages.reverse().forEach((msg) => {
        const sender = msg.from?.user?.displayName || "Unknown";
        const time = new Date(msg.createdDateTime).toLocaleString("vi-VN");
        const body = msg.body?.content
            ?.replace(/<[^>]*>/g, "") // strip HTML tags
            .trim();

        if (!body) return;

        console.log(`${c.magenta}${sender}${c.reset} ${c.dim}• ${time}${c.reset}`);
        console.log(`  ${body}`);
        console.log();
    });
    log.divider();
}

// ─── Interactive prompt ───────────────────────────────────────────────────────
function prompt(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    return new Promise((resolve) => {
        rl.question(`${c.yellow}?${c.reset}  ${question} `, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
    console.log(`\n${c.bold}${c.blue}╔══════════════════════════════════╗${c.reset}`);
    console.log(`${c.bold}${c.blue}║   🚀  Teams CLI Tool  v1.0.0     ║${c.reset}`);
    console.log(`${c.bold}${c.blue}╚══════════════════════════════════╝${c.reset}\n`);

    log.info("Đang kết nối tới MCP Teams server...");

    let client;
    try {
        client = await createMCPClient();
        log.success("Kết nối thành công!\n");
    } catch (err) {
        log.error(`Không thể kết nối MCP server: ${err.message}`);
        log.warn("Hãy chắc chắn teams-mcp đã được cấu hình đúng.");
        process.exit(1);
    }

    try {
        // Bước 1: Chọn Team
        const teams = await listTeams(client);
        if (!teams.length) process.exit(0);

        const teamChoice = await prompt("Chọn số thứ tự Team:");
        const team = teams[parseInt(teamChoice) - 1];
        if (!team) { log.error("Lựa chọn không hợp lệ."); process.exit(1); }
        log.success(`Đã chọn: ${team.displayName}`);

        // Bước 2: Chọn Channel
        const channels = await listChannels(client, team.id);
        if (!channels.length) process.exit(0);

        const channelChoice = await prompt("Chọn số thứ tự Channel:");
        const channel = channels[parseInt(channelChoice) - 1];
        if (!channel) { log.error("Lựa chọn không hợp lệ."); process.exit(1); }
        log.success(`Đã chọn: ${channel.displayName}`);

        // Bước 3: Số tin nhắn muốn đọc
        const limitInput = await prompt("Số tin nhắn muốn đọc (mặc định: 10):");
        const limit = parseInt(limitInput) || 10;

        // Bước 4: Hiển thị tin nhắn
        await readMessages(client, team.id, channel.id, limit);

    } catch (err) {
        log.error(`Lỗi: ${err.message}`);
    } finally {
        await client.close();
        process.exit(0);
    }
}

main();