import axios from 'axios';
import * as cheerio from 'cheerio';
import { translate } from '@vitalets/google-translate-api';

export interface AirdropProject {
    source: string;
    name: string;
    status: string;
    reward: string;
    link: string;
    tasks: string;
}

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' };

async function translateText(text: string, targetLang: string): Promise<string> {
    try {
        if (!text) return text;
        const result = await translate(text, { to: targetLang });
        return result.text;
    } catch (e) {
        console.error('Ошибка перевода:', e.message);
        return text; 
    }
}

function addEmojiToStatus(status: string): string {
    const lower = status.toLowerCase();
    if (lower.includes('подтвержден') || lower.includes('confirmed') || lower.includes('confirmado')) {
        return `✅ ${status}`;
    }
    if (lower.includes('потенциальн') || lower.includes('potential') || lower.includes('potencial')) {
        return `❓ ${status}`;
    }
    return status;
}

export async function fetchAirdropsIO(): Promise<AirdropProject[]> {
    return [{
        source: 'Airdrops.io',
        name: 'LayerZero (Пример)',
        status: 'Potential', 
        reward: 'ZRO Tokens',
        link: 'https://airdrops.io/layerzero/',
        tasks: '- Use the official bridge\n- Make transactions on Stargate'
    }];
}

export async function fetchAirdropAlert(): Promise<AirdropProject[]> {
    return [{
        source: 'AirdropAlert',
        name: 'Berachain (Пример)',
        status: 'Confirmed', 
        reward: 'BERA Tokens',
        link: 'https://airdropalert.com/berachain-airdrop',
        tasks: '- Request testnet tokens\n- Swap on BEX\n- Mint HONEY'
    }];
}

export async function fetchCoinMarketCap(): Promise<AirdropProject[]> {
    return [{
        source: 'CoinMarketCap',
        name: 'ZetaChain (Пример)',
        status: 'Active',
        reward: '100,000 ZETA',
        link: 'https://coinmarketcap.com/airdrops/',
        tasks: '- Complete social tasks (X, Telegram)\n- Add token to Watchlist'
    }];
}

export async function getAllAirdrops(targetLang: string = 'ru'): Promise<AirdropProject[]> {
    console.log(`Собираем данные и переводим на язык: ${targetLang}...`);
    const [io, alert, cmc] = await Promise.all([
        fetchAirdropsIO(),
        fetchAirdropAlert(),
        fetchCoinMarketCap()
    ]);
    
    const allProjects = [...io, ...alert, ...cmc];

    const translatedProjects = await Promise.all(allProjects.map(async (p) => {
        const translatedStatus = await translateText(p.status, targetLang);
        
        return {
            ...p,
            status: addEmojiToStatus(translatedStatus),
            reward: await translateText(p.reward, targetLang),
            tasks: await translateText(p.tasks, targetLang)
        };
    }));
    
    return translatedProjects;
}

export function formatMessage(projects: AirdropProject[], lang: string): string {
    if (projects.length === 0) return "Нет обновлений.";
    
    let message = `🎯 > Airdrop Report (${lang.toUpperCase()})\n\n`;
    
    projects.forEach(p => {
        message += `**[${p.source}] ${p.name}**\n`;
        message += `• Status: ${p.status}\n`;
        message += `• Reward: ${p.reward}\n`;
        message += `• Tasks:\n${p.tasks}\n`;
        message += `🔗 [More info](${p.link})\n\n`;
    });
    
    return message.trim();
}
