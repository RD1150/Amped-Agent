/**
 * GoHighLevel Auto-Funnel Generation
 * Automatically creates landing pages from social media posts
 */

interface FunnelTemplate {
  type: "property_listing" | "market_update" | "general";
  htmlTemplate: string;
}

interface PostContent {
  title: string;
  description: string;
  imageUrl?: string;
  agentName: string;
  agentEmail: string;
  agentPhone?: string;
}

interface FunnelResult {
  funnelId: string;
  pageUrl: string;
  shortUrl: string;
}

/**
 * Generate HTML for landing page
 */
function generateLandingPageHTML(content: PostContent, template: FunnelTemplate): string {
  const { title, description, imageUrl, agentName, agentEmail, agentPhone } = content;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      min-height: 100vh;
    }
    .hero {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 60px 20px;
      text-align: center;
    }
    .hero h1 {
      font-size: 2.5rem;
      margin-bottom: 20px;
      font-weight: 700;
    }
    .hero-image {
      width: 100%;
      max-width: 600px;
      height: 400px;
      object-fit: cover;
      border-radius: 12px;
      margin: 30px auto;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .content {
      padding: 40px 20px;
    }
    .content p {
      font-size: 1.1rem;
      margin-bottom: 20px;
      color: #555;
    }
    .form-section {
      background: #f8f9fa;
      padding: 40px 20px;
      border-top: 3px solid #667eea;
    }
    .form-section h2 {
      text-align: center;
      margin-bottom: 10px;
      color: #333;
    }
    .form-section p {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
    }
    .form {
      max-width: 500px;
      margin: 0 auto;
    }
    .form-group {
      margin-bottom: 20px;
    }
    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #333;
    }
    .form-group input,
    .form-group textarea {
      width: 100%;
      padding: 12px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }
    .form-group input:focus,
    .form-group textarea:focus {
      outline: none;
      border-color: #667eea;
    }
    .submit-btn {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 1.1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .submit-btn:hover {
      transform: translateY(-2px);
    }
    .agent-info {
      background: #fff;
      padding: 40px 20px;
      text-align: center;
      border-top: 1px solid #e0e0e0;
    }
    .agent-info h3 {
      margin-bottom: 15px;
      color: #333;
    }
    .agent-info p {
      color: #666;
      margin: 5px 0;
    }
    @media (max-width: 768px) {
      .hero h1 { font-size: 1.8rem; }
      .hero-image { height: 300px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="hero">
      <h1>${title}</h1>
      ${imageUrl ? `<img src="${imageUrl}" alt="${title}" class="hero-image">` : ''}
    </div>

    <div class="content">
      <p>${description.replace(/\n/g, '<br>')}</p>
    </div>

    <div class="form-section">
      <h2>Get More Information</h2>
      <p>Fill out the form below and I'll get back to you right away!</p>
      
      <form class="form" id="leadForm" action="/api/ghl/submit-lead" method="POST">
        <div class="form-group">
          <label for="name">Full Name *</label>
          <input type="text" id="name" name="name" required>
        </div>
        
        <div class="form-group">
          <label for="email">Email Address *</label>
          <input type="email" id="email" name="email" required>
        </div>
        
        <div class="form-group">
          <label for="phone">Phone Number</label>
          <input type="tel" id="phone" name="phone">
        </div>
        
        <div class="form-group">
          <label for="message">Message</label>
          <textarea id="message" name="message" rows="4" placeholder="Tell me what you're looking for..."></textarea>
        </div>
        
        <button type="submit" class="submit-btn">Send Message</button>
      </form>
    </div>

    <div class="agent-info">
      <h3>Contact ${agentName}</h3>
      <p>Email: ${agentEmail}</p>
      ${agentPhone ? `<p>Phone: ${agentPhone}</p>` : ''}
    </div>
  </div>

  <script>
    document.getElementById('leadForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await fetch(e.target.action, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        if (response.ok) {
          alert('Thank you! I\\'ll be in touch soon.');
          e.target.reset();
        } else {
          alert('Something went wrong. Please try again.');
        }
      } catch (error) {
        alert('Something went wrong. Please try again.');
      }
    });
  </script>
</body>
</html>
  `.trim();
}

/**
 * Create funnel in GoHighLevel
 * Note: This is a simplified implementation. In production, you would:
 * 1. Use GHL API to create actual funnels
 * 2. Store funnel pages in GHL
 * 3. Get proper short URLs from GHL
 */
export async function createAutoFunnel(
  content: PostContent,
  ghlApiKey: string,
  ghlLocationId: string
): Promise<FunnelResult> {
  // Determine template type based on content
  const templateType: FunnelTemplate["type"] = 
    content.title.toLowerCase().includes("listing") || content.title.toLowerCase().includes("property")
      ? "property_listing"
      : content.title.toLowerCase().includes("market")
      ? "market_update"
      : "general";

  const template: FunnelTemplate = {
    type: templateType,
    htmlTemplate: "",
  };

  // Generate landing page HTML
  const html = generateLandingPageHTML(content, template);

  // In a real implementation, you would:
  // 1. Call GHL API to create a new page
  // 2. Upload the HTML content
  // 3. Get the page URL and create a short link
  
  // For now, we'll return a mock response
  // TODO: Implement actual GHL API integration
  
  const funnelId = `funnel_${Date.now()}`;
  const pageUrl = `https://ghl.example.com/pages/${funnelId}`;
  const shortUrl = `https://ghl.example.com/l/${funnelId.substring(7)}`;

  return {
    funnelId,
    pageUrl,
    shortUrl,
  };
}

/**
 * Extract content from social post for funnel generation
 */
export function extractFunnelContent(
  postContent: string,
  postType: string,
  imageUrl?: string,
  agentName?: string,
  agentEmail?: string,
  agentPhone?: string
): PostContent {
  // Extract title (first line or first sentence)
  const lines = postContent.split('\n').filter(l => l.trim());
  const title = lines[0] || "Learn More";
  
  // Use remaining content as description
  const description = lines.slice(1).join('\n') || postContent;

  return {
    title,
    description,
    imageUrl,
    agentName: agentName || "Your Real Estate Agent",
    agentEmail: agentEmail || "agent@example.com",
    agentPhone,
  };
}
