import { renderAutoReel, getRenderStatus } from './server/_core/videoRenderer.js';
import { invokeLLM } from './server/_core/llm.js';

const samples = [
  {
    name: 'Modern Downtown Condo',
    inputText: `Stunning 2-bedroom downtown condo with floor-to-ceiling windows
• Open concept living with modern finishes
• Gourmet kitchen with stainless appliances
• Private balcony with city views
• Walking distance to restaurants and shops`,
    tone: 'bold',
    duration: 15
  },
  {
    name: 'First-Time Buyer Tips',
    inputText: `Essential tips for first-time homebuyers
• Get pre-approved before house hunting
• Budget for closing costs (2-5% of purchase price)
• Don't skip the home inspection
• Consider future resale value`,
    tone: 'warm',
    duration: 15
  },
  {
    name: 'Market Update 2026',
    inputText: `Real estate market trends for 2026
• Interest rates stabilizing around 6%
• Inventory levels increasing in most markets
• Buyers have more negotiating power
• Great time for strategic buyers`,
    tone: 'authoritative',
    duration: 15
  }
];

const toneDescriptions = {
  calm: 'calm, soothing, and reassuring',
  bold: 'bold, confident, and attention-grabbing',
  authoritative: 'authoritative, expert, and trustworthy',
  warm: 'warm, friendly, and approachable'
};

async function generateVideo(sample) {
  console.log(`\n🎬 Generating: ${sample.name}`);
  
  try {
    // Step 1: Generate hook
    console.log('  📝 Generating hook...');
    const hooksResponse = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are an expert social media copywriter specializing in real estate content. Create scroll-stopping hooks for short-form vertical videos.

A great hook:
- Stops the scroll in the first 2 seconds
- Creates curiosity or urgency
- Is short (under 10 words)
- Speaks directly to the target audience

The tone should be: ${toneDescriptions[sample.tone]}`
        },
        {
          role: 'user',
          content: `Create 1 scroll-stopping hook for a ${sample.duration}-second real estate video based on:

${sample.inputText}

Return ONLY the hook text, no numbering or explanation.`
        }
      ]
    });
    
    const hookContent = hooksResponse.choices[0].message.content;
    const hook = typeof hookContent === 'string' ? hookContent.trim() : '';
    console.log(`  ✅ Hook: ${hook}`);
    
    // Step 2: Generate script
    console.log('  📝 Generating script...');
    const scriptResponse = await invokeLLM({
      messages: [
        {
          role: 'system',
          content: `You are an expert scriptwriter for short-form vertical videos. Your scripts are:
- Conversational and natural
- Written in short, punchy sentences
- ${sample.duration} seconds when read aloud (approximately ${Math.floor(sample.duration * 2.5)} words)
- Tone: ${toneDescriptions[sample.tone]}

Write scripts that sound like a real person talking.`
        },
        {
          role: 'user',
          content: `Write a ${sample.duration}-second script for a real estate video based on:

${sample.inputText}

Return ONLY the script text, no formatting or labels.`
        }
      ]
    });
    
    const scriptContent = scriptResponse.choices[0].message.content;
    const script = typeof scriptContent === 'string' ? scriptContent.trim() : '';
    console.log(`  ✅ Script generated (${script.split(' ').length} words)`);
    
    // Step 3: Render video
    console.log('  🎥 Rendering video...');
    const renderResult = await renderAutoReel({
      hook,
      script,
      tone: sample.tone,
      duration: sample.duration
    });
    
    const renderId = renderResult.renderId;
    console.log(`  ⏳ Render ID: ${renderId}`);
    
    // Step 4: Poll for completion
    console.log('  ⏳ Waiting for render to complete (this takes 1-2 minutes)...');
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const status = await getRenderStatus(renderId);
      
      if (status.status === 'done') {
        console.log(`  ✅ Video ready!`);
        console.log(`     URL: ${status.url}`);
        return {
          name: sample.name,
          url: status.url,
          thumbnail: status.thumbnail,
          tone: sample.tone,
          duration: sample.duration,
          hook,
          script
        };
      } else if (status.status === 'failed') {
        throw new Error(`Render failed: ${status.error || 'Unknown error'}`);
      }
      
      attempts++;
      if (attempts % 6 === 0) {
        console.log(`  ⏳ Still rendering... (${Math.floor(attempts * 5 / 60)} min)`);
      }
    }
    
    throw new Error('Render timeout after 5 minutes');
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    return null;
  }
}

async function main() {
  console.log('🚀 Generating 3 Authority Reels sample videos...');
  console.log('⏱️  This will take approximately 5-10 minutes\n');
  
  const results = [];
  
  for (const sample of samples) {
    const result = await generateVideo(sample);
    if (result) {
      results.push(result);
    }
  }
  
  console.log('\n\n📊 GENERATION COMPLETE!\n');
  console.log(JSON.stringify(results, null, 2));
  
  // Save results
  const fs = await import('fs');
  fs.writeFileSync('/home/ubuntu/sample-videos.json', JSON.stringify(results, null, 2));
  console.log('\n✅ Results saved to /home/ubuntu/sample-videos.json');
  
  console.log('\n📹 Generated Videos:');
  results.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name} (${r.tone}, ${r.duration}s)`);
    console.log(`   ${r.url}`);
  });
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
