import { Hono } from 'hono';
import { getAllAirdrops, formatMessage } from './airdrops';

const app = new Hono();
const PORT = process.env.PORT || 5123;

app.get('/.well-known/agent-metadata.json', (c) => {
  return c.json({
      name: "Airdrop Hunter Bot",
      description: "Собирает дропы и переводит их на любой указанный язык пользователя.",
      version: "1.4.0"
  });
});

app.post('/webhook', async (c) => {
    const body = await c.req.json();
    
    if (body.text && body.text.includes('/drop')) {
        console.log(`Получена команда из канала: ${body.channelId}`);
        
        // Пример: пользователь пишет "/drop es" или "/drop en" или просто "/drop" (по умолчанию 'ru')
        const args = body.text.trim().split(' ');
        const targetLang = args[1] && args[1].length === 2 ? args[1].toLowerCase() : 'ru';
        
        console.log(`Выбранный язык пользователем: ${targetLang}`);
        
        const projects = await getAllAirdrops(targetLang);
        const replyMessage = formatMessage(projects, targetLang);
        
        console.log(`Ответ сформирован на языке [${targetLang}] для канала ${body.channelId}`);
        // await bot.sendMessage(body.channelId, { text: replyMessage });
    }
    
    return c.json({ success: true });
});

console.log(`🤖 Мультиязычный бот успешно запущен на порту ${PORT}`);
