const Discord = require('discord.js-selfbot-v13');
const fs = require('fs');
const readline = require('readline');

const client = new Discord.Client({
  checkUpdate: false
});

const serverIds = [
  'server id here', '12345', 'example'
];

let fileStream;

async function searchMessages(serverId, targetUserId) {
  console.log(`\nSearching in server ${serverId}...`);

  let totalContentMessages = 0;
  let totalAuthorMessages = 0;

  try {
    console.log(`Looking for mentions of ${targetUserId}...`);
    let offset = 0;
    let hasMore = true;

    while (hasMore) {
      const response1 = await client.api.guilds(serverId).messages.search.get({
        query: {
          content: targetUserId,
          sort_by: 'timestamp',
          sort_order: 'desc',
          offset: offset
        }
      });

      if (response1.messages && response1.messages.length > 0) {
        response1.messages.forEach(messageGroup => {
          const data = {
            server_id: serverId,
            target_user_id: targetUserId,
            search_type: 'content_search',
            messages: messageGroup
          };
          fileStream.write(JSON.stringify(data) + '\n');
          totalContentMessages++;
        });
        
        offset += 25;
        console.log(`  ${totalContentMessages} mentions found`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (response1.messages.length < 25) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`fetching messages sent by ${targetUserId}...`);
    offset = 0;
    hasMore = true;

    while (hasMore) {
      const response2 = await client.api.guilds(serverId).messages.search.get({
        query: {
          author_id: targetUserId,
          sort_by: 'timestamp',
          sort_order: 'desc',
          offset: offset
        }
      });

      if (response2.messages && response2.messages.length > 0) {
        response2.messages.forEach(messageGroup => {
          const data = {
            server_id: serverId,
            target_user_id: targetUserId,
            search_type: 'author_search',
            messages: messageGroup
          };
          fileStream.write(JSON.stringify(data) + '\n');
          totalAuthorMessages++;
        });
        
        offset += 25;
        console.log(`  ${totalAuthorMessages} messages found`);
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        if (response2.messages.length < 25) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

  } catch (err) {
    console.error(`Something went wrong ${serverId}: ${err.message}`);
  }

  console.log(`Done ${serverId} - ${totalContentMessages + totalAuthorMessages} results total`);
}

async function main(targetUserId) {
  const filename = `messages_${targetUserId}.jsonl`;
  fileStream = fs.createWriteStream(filename, { flags: 'a' });
  console.log(`Saving results to ${filename}\n`);

  for (const serverId of serverIds) {
    await searchMessages(serverId, targetUserId);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  fileStream.end();
  console.log(`\ndone check on ${filename}`);
  process.exit(0);
}

client.on('ready', async () => {
  console.log(`Logged in as ${client.user.tag}\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter user ID: ', (targetUserId) => {
    rl.close();
    
    if (!targetUserId || targetUserId.trim() === '') {
      console.log('Invalid ID');
      process.exit(1);
    }

    main(targetUserId.trim());
  });
});

client.login('Token here');






